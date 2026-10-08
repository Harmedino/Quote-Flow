import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll } from 'vitest';
import { configureMongoose } from '../db/connection';
import { type IndexReport, buildDeclaredIndexes } from '../db/indexes';
import { ALL_MODELS } from '../models';

/**
 * Integration tests run only when MONGODB_TEST_URI points at a disposable
 * MongoDB server. Each test file gets its own database, dropped afterwards.
 */
export const TEST_DATABASE_URI = process.env.MONGODB_TEST_URI;

const CONNECT_TIMEOUT_MS = 5_000;
const SETUP_TIMEOUT_MS = 60_000;

function uniqueDatabaseName(uri: string): string {
  const configured = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.exec(uri)?.[1];
  return `${configured ?? 'quoteflow_test'}_${randomBytes(4).toString('hex')}`;
}

export interface TestDatabase {
  /** How building each model's declared indexes went. */
  indexReports(): readonly IndexReport[];
}

/** Call inside a `describe.skipIf(!TEST_DATABASE_URI)` block. */
export function useTestDatabase(): TestDatabase {
  let reports: IndexReport[] = [];

  beforeAll(async () => {
    if (!TEST_DATABASE_URI) throw new Error('MONGODB_TEST_URI is not set');
    configureMongoose();
    await mongoose.connect(TEST_DATABASE_URI, {
      dbName: uniqueDatabaseName(TEST_DATABASE_URI),
      autoIndex: false,
      monitorCommands: true,
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    });
    // Let each model finish creating its collection, so no setup command overlaps a test.
    await Promise.all(ALL_MODELS.map((model) => model.init()));
    reports = await buildDeclaredIndexes(ALL_MODELS);
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  return { indexReports: () => reports };
}

/** Whether a stand-in server (e.g. FerretDB) rejected an index option it has not implemented. */
export function isUnsupportedIndexOption(report: IndexReport | undefined): boolean {
  const error = report?.error;
  return error instanceof mongoose.mongo.MongoServerError && error.codeName === 'NotImplemented';
}

/**
 * Whether concurrent `findOneAndUpdate` `$inc` calls on one document are
 * atomic, as MongoDB guarantees. FerretDB 1.x returns duplicates and loses increments.
 */
export async function supportsAtomicIncrements(): Promise<boolean> {
  const { db } = mongoose.connection;
  if (!db) throw new Error('The test database is not connected');
  const probes = db.collection<{ _id: string; n: number }>('capability_probes');
  const _id = randomBytes(8).toString('hex');
  const attempts = 20;

  await probes.insertOne({ _id, n: 0 });
  const results = await Promise.all(
    Array.from({ length: attempts }, () =>
      probes.findOneAndUpdate({ _id }, { $inc: { n: 1 } }, { returnDocument: 'after' }),
    ),
  );
  await probes.deleteOne({ _id });
  return new Set(results.map((result) => result?.n)).size === attempts;
}

export interface RecordedCommand {
  name: string;
  command: Record<string, unknown>;
}

/** Records the commands sent to the server while `action` runs. */
export async function recordCommands(action: () => Promise<unknown>): Promise<RecordedCommand[]> {
  const client = mongoose.connection.getClient();
  const recorded: RecordedCommand[] = [];
  const listener = (event: mongoose.mongo.CommandStartedEvent) => {
    recorded.push({ name: event.commandName, command: event.command });
  };

  client.on('commandStarted', listener);
  try {
    await action();
  } finally {
    client.off('commandStarted', listener);
  }
  return recorded;
}
