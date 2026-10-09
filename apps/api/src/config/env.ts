import { z } from 'zod';

const NODE_ENVS = ['development', 'test', 'production'] as const;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const LOCAL_WEB_APP_URL = 'http://localhost:5173';

/**
 * Thrown when the environment is invalid. The message lists every problem by
 * variable name only — values are never included because they may be secrets.
 */
export class EnvValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(['Invalid environment configuration:', ...problems.map((p) => `  - ${p}`)].join('\n'));
    this.name = 'EnvValidationError';
    this.problems = problems;
  }
}

function parseHttpUrl(value: string): URL | undefined {
  if (!URL.canParse(value)) return undefined;
  const url = new URL(value);
  return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
}

/** True for a bare origin exactly as browsers send it in the Origin header. */
function isHttpOrigin(value: string): boolean {
  return parseHttpUrl(value)?.origin === value;
}

/** `requiredMessage` is reported when the variable is unset; give it only when there is no default. */
function integerInRange(min: number, max: number, requiredMessage?: string) {
  const message = `must be an integer between ${min} and ${max}`;
  return z
    .string({ error: requiredMessage })
    .regex(/^\d+$/, message)
    .transform(Number)
    .pipe(z.number().min(min, message).max(max, message));
}

const nodeEnvSchema = z.enum(NODE_ENVS, { error: `must be one of: ${NODE_ENVS.join(', ')}` });

const logLevelSchema = z.enum(LOG_LEVELS, { error: `must be one of: ${LOG_LEVELS.join(', ')}` });

const mongoUriSchema = z
  .string({ error: 'is required' })
  .regex(/^mongodb(?:\+srv)?:\/\/./, {
    error: 'must start with mongodb:// or mongodb+srv://',
    abort: true,
  })
  // Without a database name the driver silently uses "test".
  .regex(
    /^mongodb(?:\+srv)?:\/\/[^/?]+\/[^/?]+/,
    'must include a database name, e.g. mongodb://127.0.0.1:27017/quoteflow',
  );

function jwtSecretSchema(isProduction: boolean) {
  const schema = z
    .string({ error: 'is required' })
    .min(32, { error: 'must be at least 32 characters long', abort: true });
  // Catches repeated placeholders such as "changeme" × 4; a generated secret has far more variety.
  return isProduction
    ? schema.refine(
        (value) => new Set(value).size >= 10,
        'must be a random value; generate one with the command in .env.example',
      )
    : schema;
}

const DURATION_UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

/** Converts a duration such as `15m` or `3600s`, already validated by the schema below, to seconds. */
export function durationInSeconds(value: string): number {
  const unit = value.slice(-1) as keyof typeof DURATION_UNIT_SECONDS;
  return Number(value.slice(0, -1)) * DURATION_UNIT_SECONDS[unit];
}

const accessTokenTtlSchema = z
  .string()
  .regex(/^[1-9]\d*[smhd]$/, {
    error: 'must be a positive whole number followed by s, m, h or d (e.g. 15m)',
    abort: true,
  })
  .refine((value) => {
    const seconds = durationInSeconds(value);
    return seconds >= 60 && seconds <= 3600;
  }, 'must be between 1m and 1h');

function originListSchema(requireHttps: boolean) {
  const origin = z
    .string()
    .refine(isHttpOrigin, {
      error:
        'must be an http(s) origin such as https://app.example.com (no path, trailing slash or wildcard)',
      abort: true,
    })
    .refine(
      (value) => !requireHttps || value.startsWith('https://'),
      'must use https in production',
    );

  return z
    .string({ error: 'is required in production' })
    .transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry !== ''),
      ),
    ])
    .pipe(z.array(origin).min(1, 'must list at least one origin'));
}

function appUrlSchema(requireHttps: boolean) {
  return z.string({ error: 'is required in production' }).transform((value, ctx) => {
    const url = parseHttpUrl(value);
    if (!url || url.username || url.password || url.search || url.hash) {
      ctx.addIssue({
        code: 'custom',
        message: 'must be an absolute http(s) URL without credentials, query or fragment',
      });
      return z.NEVER;
    }
    if (requireHttps && url.protocol !== 'https:') {
      ctx.addIssue({ code: 'custom', message: 'must use https in production' });
      return z.NEVER;
    }
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  });
}

const booleanFlagSchema = z
  .enum(['true', 'false'], { error: 'must be true or false' })
  .transform((value) => value === 'true');

/** What every process that talks to MongoDB needs, including the ops scripts. */
const databaseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  MONGODB_URI: mongoUriSchema,
  LOG_LEVEL: logLevelSchema.default('info'),
});

function createServerEnvSchema(isProduction: boolean) {
  return databaseEnvSchema.extend({
    PORT: integerInRange(1, 65535).default(4000),
    JWT_SECRET: jwtSecretSchema(isProduction),
    ACCESS_TOKEN_TTL: accessTokenTtlSchema.default('15m'),
    REFRESH_TOKEN_TTL_DAYS: integerInRange(1, 365).default(30),
    CORS_ORIGIN: isProduction
      ? originListSchema(true)
      : originListSchema(false).default([LOCAL_WEB_APP_URL]),
    APP_URL: isProduction ? appUrlSchema(true) : appUrlSchema(false).default(LOCAL_WEB_APP_URL),
    // A silent default of 0 behind a load balancer would rate-limit every client as one IP.
    TRUST_PROXY: isProduction
      ? integerInRange(
          0,
          10,
          'is required in production (0 when the API is exposed directly, 1 behind one load balancer)',
        )
      : integerInRange(0, 10).default(0),
    // Off unless asked for: it lets anyone sign in to the shared demo business.
    DEMO_LOGIN_ENABLED: booleanFlagSchema.default(false),
  });
}

/** The API server's configuration. */
export type Env = Readonly<z.output<ReturnType<typeof createServerEnvSchema>>>;
/** The configuration of command-line scripts (seed, index build), which only use the database. */
export type ScriptEnv = Readonly<z.output<typeof databaseEnvSchema>>;

/** Empty or whitespace-only values are treated as unset (`.env.example` ships `JWT_SECRET=`). */
function readVariable(source: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = source[name];
  return value === undefined || value.trim() === '' ? undefined : value;
}

function describeIssue(issue: z.core.$ZodIssue): string {
  const [name, entry] = issue.path;
  const label = typeof entry === 'number' ? `${String(name)} (entry ${entry + 1})` : String(name);
  return `${label}: ${issue.message}`;
}

function parseEnv<Schema extends z.ZodObject>(
  schema: Schema,
  source: NodeJS.ProcessEnv,
): Readonly<z.output<Schema>> {
  const raw = Object.fromEntries(
    Object.keys(schema.shape).map((name) => [name, readVariable(source, name)]),
  );

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new EnvValidationError(result.error.issues.map(describeIssue));
  }
  return Object.freeze(result.data);
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const isProduction = readVariable(source, 'NODE_ENV') === 'production';
  return parseEnv(createServerEnvSchema(isProduction), source);
}

export function loadScriptEnv(source: NodeJS.ProcessEnv = process.env): ScriptEnv {
  return parseEnv(databaseEnvSchema, source);
}
