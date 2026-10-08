import type { Request, RequestHandler } from 'express';
import { z } from 'zod';

export interface RequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

type Parsed<Schema, Fallback> = Schema extends z.ZodType ? z.output<Schema> : Fallback;

export type ValidatedParams<S extends RequestSchemas> = Parsed<S['params'], Request['params']>;
export type ValidatedQuery<S extends RequestSchemas> = Parsed<S['query'], Request['query']>;
export type ValidatedBody<S extends RequestSchemas> = Parsed<S['body'], unknown>;

/**
 * The request type seen by handlers that run after `validate(schemas)`.
 * Controllers declared in their own module use it to type `req`:
 *
 *   const schemas = { params: z.object({ id: objectIdSchema }) } satisfies RequestSchemas;
 *   export function getQuote(req: ValidatedRequest<typeof schemas>, res: Response) { … }
 */
export type ValidatedRequest<S extends RequestSchemas> = Request<
  ValidatedParams<S>,
  unknown,
  ValidatedBody<S>,
  ValidatedQuery<S>
>;

const LOCATIONS = ['params', 'query', 'body'] as const;

/**
 * Parses `req.params`, `req.query` and `req.body` with the given Zod schemas
 * and replaces them with the parsed (coerced, defaulted, stripped) values.
 * Issues from every location are reported together as one ZodError, which the
 * error handler turns into a 400 VALIDATION_ERROR response.
 *
 * Use it inside a route's handler chain, not with `router.use()`: the router
 * resets `req.params` for every layer it matches.
 */
export function validate<S extends RequestSchemas>(
  schemas: S,
): RequestHandler<ValidatedParams<S>, unknown, ValidatedBody<S>, ValidatedQuery<S>> {
  return async (req, _res, next) => {
    const issues: z.core.$ZodIssue[] = [];
    const parsed: Partial<Record<(typeof LOCATIONS)[number], unknown>> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = await schema.safeParseAsync(req[location]);
      if (result.success) parsed[location] = result.data;
      else issues.push(...result.error.issues);
    }

    if (issues.length > 0) throw new z.ZodRealError(issues);

    if ('params' in parsed) req.params = parsed.params as ValidatedParams<S>;
    if ('body' in parsed) req.body = parsed.body as ValidatedBody<S>;
    // Express 5 exposes req.query through a prototype getter that re-parses the
    // URL on every access, so the parsed value is installed as an own property.
    if ('query' in parsed) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  };
}
