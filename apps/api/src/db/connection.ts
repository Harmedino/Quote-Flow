import mongoose from 'mongoose';
import type { Logger } from '../utils/logger';

const SERVER_SELECTION_TIMEOUT_MS = 10_000;
const APP_NAME = 'quoteflow-api';

export type DatabaseState = keyof typeof mongoose.ConnectionStates;

export interface ConnectDatabaseOptions {
  /** Build indexes when models initialise. Disabled in production, where `db:indexes` builds them. */
  autoIndex: boolean;
  logger: Logger;
}

/**
 * Global Mongoose behaviour. Must run before any query is issued.
 *
 * - strictQuery 'throw': a filter on a path that is not in the schema fails
 *   loudly. With plain `true` Mongoose silently drops such keys, so a typo in a
 *   `businessId` filter would widen a query to every tenant.
 * - sanitizeFilter off: it rewrites every operator object (`$in`, `$gte`…) into
 *   `$eq` unless wrapped in `mongoose.trusted()`, which silently breaks
 *   legitimate service queries. Operator injection is prevented at the edge
 *   instead: every request is parsed with Zod, so filters only ever receive
 *   validated primitives.
 */
export function configureMongoose(): void {
  mongoose.set('strictQuery', 'throw');
  mongoose.set('sanitizeFilter', false);
}

let detachConnectionLogging: (() => void) | undefined;

function logConnectionEvents(connection: mongoose.Connection, logger: Logger): () => void {
  const onDisconnected = () => logger.warn('MongoDB connection lost; the driver will retry');
  const onReconnected = () => logger.info('MongoDB connection re-established');
  const onError = (error: unknown) => logger.error({ err: error }, 'MongoDB connection error');

  connection.on('disconnected', onDisconnected);
  connection.on('reconnected', onReconnected);
  connection.on('error', onError);

  return () => {
    connection.off('disconnected', onDisconnected);
    connection.off('reconnected', onReconnected);
    connection.off('error', onError);
  };
}

/**
 * Opens the shared Mongoose connection. The URI is never logged because it may
 * contain credentials; only the host and database name reported by the driver are.
 */
export async function connectDatabase(
  uri: string,
  { autoIndex, logger }: ConnectDatabaseOptions,
): Promise<void> {
  configureMongoose();
  logger.info('Connecting to MongoDB');

  await mongoose.connect(uri, {
    autoIndex,
    appName: APP_NAME,
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });

  const { connection } = mongoose;
  logger.info(
    { host: connection.host, port: connection.port, database: connection.name, autoIndex },
    'Connected to MongoDB',
  );

  // Attached only after the initial connection so a startup failure is reported once, by the caller.
  detachConnectionLogging?.();
  detachConnectionLogging = logConnectionEvents(connection, logger);
}

export async function disconnectDatabase(): Promise<void> {
  detachConnectionLogging?.();
  detachConnectionLogging = undefined;
  await mongoose.disconnect();
}

export function getDatabaseState(): DatabaseState {
  switch (mongoose.connection.readyState) {
    case mongoose.ConnectionStates.connected:
      return 'connected';
    case mongoose.ConnectionStates.connecting:
      return 'connecting';
    case mongoose.ConnectionStates.disconnecting:
      return 'disconnecting';
    case mongoose.ConnectionStates.uninitialized:
      return 'uninitialized';
    default:
      return 'disconnected';
  }
}

export function isDatabaseConnected(): boolean {
  return getDatabaseState() === 'connected';
}
