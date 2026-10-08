import pino, { type DestinationStream, type LevelWithSilent, type Logger } from 'pino';

export type { Logger };

export interface CreateLoggerOptions {
  level: LevelWithSilent;
  /** Human-readable output for local development. Loads pino-pretty, a dev-only dependency. */
  pretty: boolean;
  /** Where JSON logs are written (defaults to stdout). Ignored when `pretty` is true. */
  destination?: DestinationStream;
}

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'publicToken',
];

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  ...SENSITIVE_FIELDS.flatMap((field) => [field, `*.${field}`, `*.*.${field}`]),
];

export function createLogger({ level, pretty, destination }: CreateLoggerOptions): Logger {
  const options: pino.LoggerOptions = {
    level,
    redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
  };

  if (pretty) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
      },
    });
  }
  return pino(options, destination);
}
