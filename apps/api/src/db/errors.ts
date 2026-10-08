import mongoose from 'mongoose';

const DUPLICATE_KEY_ERROR_CODE = 11000;

/** A write rejected by a unique index. */
export function isDuplicateKeyError(error: unknown): error is mongoose.mongo.MongoServerError {
  return (
    error instanceof mongoose.mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR_CODE
  );
}
