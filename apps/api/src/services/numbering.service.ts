import { formatDocumentNumber } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import { isDuplicateKeyError } from '../db/errors';
import { CounterModel, type DocumentKind } from '../models/counter.model';

async function incrementCounter(businessId: Types.ObjectId, kind: DocumentKind): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { businessId, key: kind },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  if (!counter) throw new Error(`Counter upsert for ${kind} returned no document`);
  return counter.seq;
}

/**
 * Issues the next number for a business's quotes or invoices, e.g. `QT-0042`.
 * The increment is a single atomic upsert, so concurrent callers always get
 * distinct numbers. Two first-ever upserts can race to insert the counter; the
 * loser hits the unique { businessId, key } index and retries once, by which
 * time the counter exists. The unique number index on each document collection
 * is the final guard. Numbers are not reused if the document is never saved.
 */
export async function nextDocumentNumber(
  businessId: Types.ObjectId,
  kind: DocumentKind,
  prefix: string,
): Promise<string> {
  let sequence: number;
  try {
    sequence = await incrementCounter(businessId, kind);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    sequence = await incrementCounter(businessId, kind);
  }
  return formatDocumentNumber(prefix, sequence);
}
