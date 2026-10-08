import type { ApiErrorResponse, ApiFieldError } from '@quoteflow/shared';
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { isDuplicateKeyError } from '../db/errors';
import { AppError, badRequest, conflict, validationFailed } from '../utils/app-error';
import { getRequestId } from './request-logger';

/** An error created by the `http-errors` package, e.g. by Express's body parser. */
interface HttpError extends Error {
  status: number;
  expose: boolean;
  type?: string;
}

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number' &&
    'expose' in error &&
    typeof error.expose === 'boolean'
  );
}

function fromZodError(error: z.ZodError): AppError {
  const details: ApiFieldError[] = error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return validationFailed(details);
}

function fromMongooseValidationError(error: mongoose.Error.ValidationError): AppError {
  const details: ApiFieldError[] = Object.entries(error.errors).map(([path, fieldError]) => ({
    path,
    message: fieldError instanceof mongoose.Error.CastError ? 'Invalid value' : fieldError.message,
  }));
  return validationFailed(details);
}

function fromHttpError(error: HttpError): AppError | undefined {
  if (error.type === 'entity.parse.failed') {
    return new AppError('INVALID_JSON', 'The request body is not valid JSON.');
  }
  if (error.type === 'entity.too.large') {
    return new AppError('PAYLOAD_TOO_LARGE', 'The request body is too large.');
  }
  if (error.expose && error.status >= 400 && error.status < 500) return badRequest();
  return undefined;
}

/** Maps any thrown value to an error that is safe to return to the client. */
export function toClientError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError) return fromZodError(error);
  if (error instanceof mongoose.Error.ValidationError) return fromMongooseValidationError(error);
  if (error instanceof mongoose.Error.CastError) return badRequest('Invalid identifier');
  if (isDuplicateKeyError(error)) {
    return conflict('A record with the same unique value already exists.');
  }
  if (error instanceof mongoose.Error.VersionError) {
    return conflict('This record was changed by someone else. Reload it and try again.');
  }
  if (isHttpError(error)) {
    const mapped = fromHttpError(error);
    if (mapped) return mapped;
  }
  return new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

function asError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error('A non-error value was thrown', { cause: value });
}

/**
 * Central error handler. Responds with the standard error envelope and never
 * exposes stack traces or internal messages. Server errors are attached to
 * `res.err`, which the request logger records (with the request context) at
 * error level; client errors are only reflected in the request log line.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    res.err = asError(error);
    next(error);
    return;
  }

  const clientError = toClientError(error);
  if (clientError.status >= 500) {
    res.err = asError(error);
  }

  const body: ApiErrorResponse = {
    error: {
      code: clientError.code,
      message: clientError.message,
      ...(clientError.details && { details: clientError.details }),
      requestId: getRequestId(req),
    },
  };
  res.status(clientError.status).json(body);
}
