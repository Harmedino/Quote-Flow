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

function integerInRange(min: number, max: number) {
  const message = `must be an integer between ${min} and ${max}`;
  return z
    .string()
    .regex(/^\d+$/, message)
    .transform(Number)
    .pipe(z.number().min(min, message).max(max, message));
}

const nodeEnvSchema = z.enum(NODE_ENVS, { error: `must be one of: ${NODE_ENVS.join(', ')}` });

const logLevelSchema = z.enum(LOG_LEVELS, { error: `must be one of: ${LOG_LEVELS.join(', ')}` });

const mongoUriSchema = z
  .string({ error: 'is required' })
  .regex(/^mongodb(?:\+srv)?:\/\/./, 'must start with mongodb:// or mongodb+srv://');

const jwtSecretSchema = z
  .string({ error: 'is required' })
  .min(32, 'must be at least 32 characters long');

const durationSchema = z
  .string()
  .regex(/^[1-9]\d*[smhd]$/, 'must be a positive whole number followed by s, m, h or d (e.g. 15m)');

const originListSchema = z
  .string({ error: 'is required in production' })
  .transform((value) => [
    ...new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry !== ''),
    ),
  ])
  .pipe(
    z
      .array(
        z
          .string()
          .refine(
            isHttpOrigin,
            'must be an http(s) origin such as https://app.example.com (no path, trailing slash or wildcard)',
          ),
      )
      .min(1, 'must list at least one origin'),
  );

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

function createEnvSchema(isProduction: boolean) {
  return z.object({
    NODE_ENV: nodeEnvSchema.default('development'),
    PORT: integerInRange(1, 65535).default(4000),
    MONGODB_URI: mongoUriSchema,
    JWT_SECRET: jwtSecretSchema,
    ACCESS_TOKEN_TTL: durationSchema.default('15m'),
    REFRESH_TOKEN_TTL_DAYS: integerInRange(1, 365).default(30),
    CORS_ORIGIN: isProduction ? originListSchema : originListSchema.default([LOCAL_WEB_APP_URL]),
    APP_URL: isProduction ? appUrlSchema(true) : appUrlSchema(false).default(LOCAL_WEB_APP_URL),
    TRUST_PROXY: integerInRange(0, 10).default(0),
    LOG_LEVEL: logLevelSchema.default('info'),
  });
}

export type Env = Readonly<z.output<ReturnType<typeof createEnvSchema>>>;

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

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const schema = createEnvSchema(readVariable(source, 'NODE_ENV') === 'production');
  const raw = Object.fromEntries(
    Object.keys(schema.shape).map((name) => [name, readVariable(source, name)]),
  );

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new EnvValidationError(result.error.issues.map(describeIssue));
  }
  return Object.freeze(result.data);
}
