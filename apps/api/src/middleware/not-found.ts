import type { RequestHandler } from 'express';
import { notFound as notFoundError } from '../utils/app-error';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(notFoundError());
};
