import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type Env,
  EnvValidationError,
  type ScriptEnv,
  durationInSeconds,
  loadEnv,
  loadScriptEnv,
} from './env';

const SECRET = 'a-very-long-jwt-secret-for-tests-0123456789';
const REQUIRED = { MONGODB_URI: 'mongodb://127.0.0.1:27017/quoteflow', JWT_SECRET: SECRET };
const PRODUCTION = {
  ...REQUIRED,
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://app.quoteflow.example',
  APP_URL: 'https://app.quoteflow.example',
  TRUST_PROXY: '0',
};

function captureError(source: NodeJS.ProcessEnv): EnvValidationError {
  try {
    loadEnv(source);
  } catch (error) {
    if (error instanceof EnvValidationError) return error;
    throw error;
  }
  throw new Error('Expected loadEnv to throw');
}

describe('loadEnv', () => {
  it('applies development defaults when only the required variables are set', () => {
    expect(loadEnv(REQUIRED)).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: REQUIRED.MONGODB_URI,
      JWT_SECRET: SECRET,
      ACCESS_TOKEN_TTL: '15m',
      REFRESH_TOKEN_TTL_DAYS: 30,
      CORS_ORIGIN: ['http://localhost:5173'],
      APP_URL: 'http://localhost:5173',
      TRUST_PROXY: 0,
      LOG_LEVEL: 'info',
      DEMO_LOGIN_ENABLED: false,
    });
  });

  it('parses explicit values', () => {
    const env = loadEnv({
      ...REQUIRED,
      NODE_ENV: 'test',
      PORT: '8080',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/quoteflow',
      ACCESS_TOKEN_TTL: '1h',
      REFRESH_TOKEN_TTL_DAYS: '7',
      TRUST_PROXY: '1',
      LOG_LEVEL: 'debug',
    });
    expect(env).toMatchObject({
      NODE_ENV: 'test',
      PORT: 8080,
      ACCESS_TOKEN_TTL: '1h',
      REFRESH_TOKEN_TTL_DAYS: 7,
      TRUST_PROXY: 1,
      LOG_LEVEL: 'debug',
    });
  });

  it('treats empty and whitespace-only values as unset', () => {
    const env = loadEnv({ ...REQUIRED, PORT: '', LOG_LEVEL: '  ', CORS_ORIGIN: '' });
    expect(env.PORT).toBe(4000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.CORS_ORIGIN).toEqual(['http://localhost:5173']);

    expect(captureError({ ...REQUIRED, JWT_SECRET: '' }).problems).toEqual([
      'JWT_SECRET: is required',
    ]);
  });

  it('enables the demo login only when asked for explicitly', () => {
    expect(loadEnv({ ...REQUIRED, DEMO_LOGIN_ENABLED: 'true' }).DEMO_LOGIN_ENABLED).toBe(true);
    expect(loadEnv({ ...REQUIRED, DEMO_LOGIN_ENABLED: 'false' }).DEMO_LOGIN_ENABLED).toBe(false);
    expect(captureError({ ...REQUIRED, DEMO_LOGIN_ENABLED: 'yes' }).problems).toEqual([
      'DEMO_LOGIN_ENABLED: must be true or false',
    ]);
  });

  it('returns a frozen, fully typed object', () => {
    expect(Object.isFrozen(loadEnv(REQUIRED))).toBe(true);
    expectTypeOf<Env>().toEqualTypeOf<
      Readonly<{
        NODE_ENV: 'development' | 'test' | 'production';
        PORT: number;
        MONGODB_URI: string;
        JWT_SECRET: string;
        ACCESS_TOKEN_TTL: string;
        REFRESH_TOKEN_TTL_DAYS: number;
        CORS_ORIGIN: string[];
        APP_URL: string;
        TRUST_PROXY: number;
        LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
        DEMO_LOGIN_ENABLED: boolean;
      }>
    >();
  });

  it('lists every problem by variable name in a single error', () => {
    const error = captureError({
      NODE_ENV: 'staging',
      PORT: '70000',
      ACCESS_TOKEN_TTL: '15 minutes',
      REFRESH_TOKEN_TTL_DAYS: '0',
      TRUST_PROXY: '11',
      LOG_LEVEL: 'verbose',
    });

    expect(error.problems.map((problem) => problem.split(':')[0])).toEqual([
      'NODE_ENV',
      'MONGODB_URI',
      'LOG_LEVEL',
      'PORT',
      'JWT_SECRET',
      'ACCESS_TOKEN_TTL',
      'REFRESH_TOKEN_TTL_DAYS',
      'TRUST_PROXY',
    ]);
    expect(error.message).toMatch(/^Invalid environment configuration:\n {2}- NODE_ENV: /);
    expect(error.message).toContain('  - MONGODB_URI: is required');
    expect(error.message).toContain('  - PORT: must be an integer between 1 and 65535');
  });

  it('never includes variable values in error messages', () => {
    const secrets = {
      MONGODB_URI: 'postgres://admin:Sup3rS3cretPassw0rd@db.internal:5432/app',
      JWT_SECRET: 'tooShortButSecret',
      PORT: 'port-secret-value',
      CORS_ORIGIN: 'https://ok.example,https://leaky.example/secret-path',
      APP_URL: 'https://user:hunter2@app.example/?token=abc',
    };
    const error = captureError(secrets);

    expect(error.problems).toHaveLength(5);
    for (const value of [
      ...Object.values(secrets),
      'Sup3rS3cretPassw0rd',
      'leaky.example',
      'hunter2',
      'token=abc',
    ]) {
      expect(error.message).not.toContain(value);
    }
  });

  it('rejects malformed MongoDB URIs and short JWT secrets', () => {
    expect(
      captureError({ MONGODB_URI: 'http://localhost:27017', JWT_SECRET: 'x'.repeat(31) }).problems,
    ).toEqual([
      'MONGODB_URI: must start with mongodb:// or mongodb+srv://',
      'JWT_SECRET: must be at least 32 characters long',
    ]);
  });

  it.each(['0m', '15', 'm', '1w', '-5m', '1.5h'])('rejects ACCESS_TOKEN_TTL %j', (value) => {
    expect(captureError({ ...REQUIRED, ACCESS_TOKEN_TTL: value }).problems).toEqual([
      expect.stringMatching(/^ACCESS_TOKEN_TTL: /),
    ]);
  });

  it.each(['99999999999999999999d', '2h', '61m', '30s', '59s'])(
    'rejects an ACCESS_TOKEN_TTL of %j outside 1m–1h',
    (value) => {
      expect(captureError({ ...REQUIRED, ACCESS_TOKEN_TTL: value }).problems).toEqual([
        'ACCESS_TOKEN_TTL: must be between 1m and 1h',
      ]);
    },
  );

  it.each(['60s', '1m', '15m', '3600s', '1h'])('accepts an ACCESS_TOKEN_TTL of %j', (value) => {
    expect(loadEnv({ ...REQUIRED, ACCESS_TOKEN_TTL: value }).ACCESS_TOKEN_TTL).toBe(value);
  });

  it.each([
    ['60s', 60],
    ['1m', 60],
    ['15m', 900],
    ['3600s', 3600],
    ['1h', 3600],
    ['2d', 172_800],
  ])('converts the duration %j to %i seconds', (value, seconds) => {
    expect(durationInSeconds(value)).toBe(seconds);
  });

  describe('MONGODB_URI', () => {
    it.each([
      'mongodb://h1:27017,h2:27017/quoteflow?replicaSet=rs',
      'mongodb+srv://user:pass@cluster.example.net/quoteflow?retryWrites=true&w=majority',
      'mongodb://%2Ftmp%2Fmongodb-27017.sock/quoteflow',
    ])('accepts %s', (uri) => {
      expect(loadEnv({ ...REQUIRED, MONGODB_URI: uri }).MONGODB_URI).toBe(uri);
    });

    it.each([
      'mongodb://127.0.0.1:27017/?retryWrites=true',
      'mongodb://127.0.0.1:27017',
      'mongodb://127.0.0.1:27017/',
      'mongodb+srv://u:p@c.example.net/',
    ])('rejects %s, which has no database name', (uri) => {
      expect(captureError({ ...REQUIRED, MONGODB_URI: uri }).problems).toEqual([
        'MONGODB_URI: must include a database name, e.g. mongodb://127.0.0.1:27017/quoteflow',
      ]);
    });
  });

  it.each(['1.5', '-1', '4000abc', '0x10'])('rejects non-integer PORT %j', (value) => {
    expect(captureError({ ...REQUIRED, PORT: value }).problems).toEqual([
      'PORT: must be an integer between 1 and 65535',
    ]);
  });

  describe('CORS_ORIGIN', () => {
    it('parses a comma-separated list, trimming entries and dropping blanks and duplicates', () => {
      const env = loadEnv({
        ...REQUIRED,
        CORS_ORIGIN: ' https://app.example.com , http://localhost:5173,,https://app.example.com ',
      });
      expect(env.CORS_ORIGIN).toEqual(['https://app.example.com', 'http://localhost:5173']);
    });

    it.each([
      ['a wildcard', '*'],
      ['a trailing slash', 'https://app.example.com/'],
      ['a path', 'https://app.example.com/app'],
      ['a non-http scheme', 'ftp://files.example.com'],
      ['an uppercase host', 'https://App.example.com'],
      ['an explicit default port', 'https://app.example.com:443'],
      ['a bare host', 'app.example.com'],
    ])('rejects %s', (_label, origin) => {
      expect(captureError({ ...REQUIRED, CORS_ORIGIN: origin }).problems).toEqual([
        expect.stringMatching(/^CORS_ORIGIN \(entry 1\): must be an http\(s\) origin/),
      ]);
    });

    it('reports the position of each invalid entry', () => {
      const error = captureError({
        ...REQUIRED,
        CORS_ORIGIN: 'https://ok.example, https://bad.example/, http://localhost:3000',
      });
      expect(error.problems).toEqual([expect.stringMatching(/^CORS_ORIGIN \(entry 2\): /)]);
    });

    it('rejects a list with no entries', () => {
      expect(captureError({ ...REQUIRED, CORS_ORIGIN: ' , ' }).problems).toEqual([
        'CORS_ORIGIN: must list at least one origin',
      ]);
    });
  });

  describe('APP_URL', () => {
    it('removes trailing slashes and keeps a path', () => {
      expect(loadEnv({ ...REQUIRED, APP_URL: 'https://example.com/' }).APP_URL).toBe(
        'https://example.com',
      );
      expect(loadEnv({ ...REQUIRED, APP_URL: 'https://example.com/quoteflow//' }).APP_URL).toBe(
        'https://example.com/quoteflow',
      );
    });

    it.each(['not a url', 'example.com', 'ftp://example.com', 'https://example.com/?a=1'])(
      'rejects %j',
      (value) => {
        expect(captureError({ ...REQUIRED, APP_URL: value }).problems).toEqual([
          expect.stringMatching(/^APP_URL: must be an absolute http\(s\) URL/),
        ]);
      },
    );
  });

  describe('in production', () => {
    it('accepts a complete configuration', () => {
      const env = loadEnv(PRODUCTION);
      expect(env.NODE_ENV).toBe('production');
      expect(env.CORS_ORIGIN).toEqual(['https://app.quoteflow.example']);
      expect(env.APP_URL).toBe('https://app.quoteflow.example');
    });

    it('requires CORS_ORIGIN, APP_URL and TRUST_PROXY instead of using local defaults', () => {
      expect(captureError({ ...REQUIRED, NODE_ENV: 'production' }).problems).toEqual([
        'CORS_ORIGIN: is required in production',
        'APP_URL: is required in production',
        'TRUST_PROXY: is required in production (0 when the API is exposed directly, 1 behind one load balancer)',
      ]);
    });

    it('accepts an explicit TRUST_PROXY of 0', () => {
      expect(loadEnv(PRODUCTION).TRUST_PROXY).toBe(0);
      expect(loadEnv({ ...PRODUCTION, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    });

    it('rejects a JWT_SECRET that is not random, which development accepts', () => {
      const placeholder = 'changemechangemechangemechangeme';
      expect(captureError({ ...PRODUCTION, JWT_SECRET: placeholder }).problems).toEqual([
        'JWT_SECRET: must be a random value; generate one with the command in .env.example',
      ]);
      expect(loadEnv({ ...REQUIRED, JWT_SECRET: placeholder }).JWT_SECRET).toBe(placeholder);
    });

    it('reports a short JWT_SECRET once', () => {
      expect(captureError({ ...PRODUCTION, JWT_SECRET: 'x'.repeat(31) }).problems).toEqual([
        'JWT_SECRET: must be at least 32 characters long',
      ]);
    });

    it('requires every CORS_ORIGIN entry to use https', () => {
      expect(
        captureError({
          ...PRODUCTION,
          CORS_ORIGIN: 'https://app.quoteflow.example,http://app.example.com',
        }).problems,
      ).toEqual(['CORS_ORIGIN (entry 2): must use https in production']);
      expect(
        captureError({ ...PRODUCTION, CORS_ORIGIN: 'http://app.example.com' }).problems,
      ).toEqual(['CORS_ORIGIN (entry 1): must use https in production']);
    });

    it('requires APP_URL to use https', () => {
      expect(
        captureError({ ...PRODUCTION, APP_URL: 'http://app.quoteflow.example' }).problems,
      ).toEqual(['APP_URL: must use https in production']);
    });
  });
});

describe('loadScriptEnv', () => {
  const DATABASE_ONLY = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1:27017/x' };

  it('needs only the database variables, even in production', () => {
    expect(loadScriptEnv(DATABASE_ONLY)).toEqual({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/x',
      LOG_LEVEL: 'info',
    });
    expectTypeOf<ScriptEnv>().toEqualTypeOf<
      Readonly<{
        NODE_ENV: 'development' | 'test' | 'production';
        MONGODB_URI: string;
        LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
      }>
    >();
  });

  it('while the server still requires its own variables', () => {
    expect(captureError(DATABASE_ONLY).problems.map((problem) => problem.split(':')[0])).toEqual([
      'JWT_SECRET',
      'CORS_ORIGIN',
      'APP_URL',
      'TRUST_PROXY',
    ]);
  });

  it('applies the same MONGODB_URI rules', () => {
    expect(() => loadScriptEnv({ MONGODB_URI: 'mongodb://127.0.0.1:27017' })).toThrow(
      /MONGODB_URI: must include a database name/,
    );
  });
});
