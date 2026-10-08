import mongoose, {
  type Model,
  type PipelineStage,
  type Query,
  type QueryOptions,
  Schema,
  Types,
} from 'mongoose';
import { describe, expect, it } from 'vitest';
import { BusinessModel, TENANT_MODELS } from '../index';
import { type TenantOwned, TenantGuardError, tenantGuard } from './tenant-guard';

/**
 * Thrown by hooks registered after the guard: reaching one proves the guard let
 * the operation through, without needing a database.
 */
class ReachedDatabase extends Error {
  constructor(readonly filter?: unknown) {
    super('The operation passed the tenant guard');
  }
}

const QUERY_OPERATIONS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'updateOne',
  'updateMany',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'countDocuments',
  'distinct',
  'estimatedDocumentCount',
] as const;

// Without buffering, an operation that slips past every hook fails at once instead of waiting
// for a connection.
const schema = new Schema({ name: String }, { bufferCommands: false });
schema.plugin(tenantGuard);
for (const operation of QUERY_OPERATIONS) {
  schema.pre(operation, function (this: Query<unknown, unknown>) {
    throw new ReachedDatabase(this.getFilter());
  });
}
schema.pre('aggregate', () => {
  throw new ReachedDatabase();
});
schema.pre('bulkWrite', () => {
  throw new ReachedDatabase();
});

const Thing = mongoose.model('TenantGuardTestThing', schema);

const tenant = new Types.ObjectId();
type Filter = Record<string, unknown>;
type Options = QueryOptions;

/** Every filtered operation, run against Thing with the given filter and query options. */
const filteredOperations: Record<string, (filter: Filter, options?: Options) => Promise<unknown>> =
  {
    find: (filter, options = {}) => Thing.find(filter).setOptions(options).exec(),
    findOne: (filter, options = {}) => Thing.findOne(filter).setOptions(options).exec(),
    findOneAndUpdate: (filter, options = {}) =>
      Thing.findOneAndUpdate(filter, { $set: { name: 'x' } })
        .setOptions(options)
        .exec(),
    findOneAndDelete: (filter, options = {}) =>
      Thing.findOneAndDelete(filter).setOptions(options).exec(),
    updateOne: (filter, options = {}) =>
      Thing.updateOne(filter, { $set: { name: 'x' } })
        .setOptions(options)
        .exec(),
    updateMany: (filter, options = {}) =>
      Thing.updateMany(filter, { $set: { name: 'x' } })
        .setOptions(options)
        .exec(),
    deleteOne: (filter, options = {}) => Thing.deleteOne(filter).setOptions(options).exec(),
    deleteMany: (filter, options = {}) => Thing.deleteMany(filter).setOptions(options).exec(),
    countDocuments: (filter, options = {}) =>
      Thing.countDocuments(filter).setOptions(options).exec(),
    distinct: (filter, options = {}) => Thing.distinct('name', filter).setOptions(options).exec(),
  };

const replaceOperations: Record<
  string,
  (filter: Filter, replacement: Filter, options?: Options) => Promise<unknown>
> = {
  findOneAndReplace: (filter, replacement, options = {}) =>
    Thing.findOneAndReplace(filter, replacement).setOptions(options).exec(),
  replaceOne: (filter, replacement, options = {}) =>
    Thing.replaceOne(filter, replacement).setOptions(options).exec(),
};

async function expectBlocked(operation: Promise<unknown>): Promise<void> {
  await expect(operation).rejects.toBeInstanceOf(TenantGuardError);
}

async function expectAllowed(operation: Promise<unknown>): Promise<void> {
  await expect(operation).rejects.toBeInstanceOf(ReachedDatabase);
}

describe('tenantGuard plugin', () => {
  it('adds a required, immutable businessId referencing Business', () => {
    const path = Thing.schema.path('businessId');
    expect(path).toBeInstanceOf(Schema.Types.ObjectId);
    expect(path.options).toMatchObject({ required: true, immutable: true, ref: 'Business' });
  });

  it('refuses a schema that declares businessId itself', () => {
    const declared = new Schema({ businessId: Types.ObjectId });
    expect(() => declared.plugin(tenantGuard)).toThrow(/adds "businessId" itself/);
  });

  describe.each(Object.entries(filteredOperations))('%s', (_name, run) => {
    it('is rejected without a businessId condition', async () => {
      await expectBlocked(run({}));
      await expectBlocked(run({ name: 'x' }));
      await expectBlocked(run({ businessId: null }));
      await expectBlocked(run({ businessId: { $exists: true } }));
    });

    it('is allowed when scoped to a business', async () => {
      await expectAllowed(run({ businessId: tenant }));
      await expectAllowed(run({ businessId: { $in: [tenant] }, name: 'x' }));
    });

    it('is allowed without a businessId condition when the guard is explicitly skipped', async () => {
      await expectAllowed(run({}, { skipTenantGuard: true }));
    });

    it('cannot be bypassed with the generic middleware: false option', async () => {
      await expectBlocked(run({}, { middleware: false }));
    });
  });

  describe.each(Object.entries(replaceOperations))('%s', (_name, run) => {
    it('requires a scoped filter and a replacement that keeps the same business', async () => {
      await expectAllowed(run({ businessId: tenant }, { businessId: tenant, name: 'x' }));
      await expectBlocked(run({}, { businessId: tenant }));
      await expectBlocked(run({ businessId: tenant }, { name: 'x' }));
      await expectBlocked(run({ businessId: tenant }, { businessId: new Types.ObjectId() }));
    });

    it('still protects businessId when the guard is skipped', async () => {
      await expectBlocked(run({}, { name: 'x' }, { skipTenantGuard: true }));
    });
  });

  it('rejects findById, which only filters by _id', async () => {
    await expectBlocked(Thing.findById(new Types.ObjectId()).exec());
  });

  it.each([
    ['$set', { $set: { businessId: new Types.ObjectId() } }],
    ['a top-level assignment', { businessId: new Types.ObjectId() }],
    ['$unset', { $unset: { businessId: 1 } }],
    ['$rename', { $rename: { businessId: 'formerBusinessId' } }],
  ])('rejects updates that change businessId via %s, even when skipped', async (_label, update) => {
    const scoped = { businessId: tenant };
    await expectBlocked(Thing.updateOne(scoped, update).exec());
    await expectBlocked(Thing.updateMany(scoped, update).exec());
    await expectBlocked(Thing.findOneAndUpdate(scoped, update).exec());
    await expectBlocked(Thing.updateMany({}, update).setOptions({ skipTenantGuard: true }).exec());
  });

  it('rejects update pipelines, which cannot be inspected', async () => {
    const pipeline = [{ $set: { name: 'x' } }];
    await expectBlocked(
      Thing.updateOne({ businessId: tenant }, pipeline, { updatePipeline: true }).exec(),
    );
  });

  it('blocks estimatedDocumentCount, which cannot be scoped, unless skipped', async () => {
    await expectBlocked(Thing.estimatedDocumentCount().exec());
    await expectAllowed(Thing.estimatedDocumentCount({ skipTenantGuard: true }).exec());
  });

  it('requires aggregations to start with a $match on businessId', async () => {
    await expectBlocked(Thing.aggregate([{ $match: { name: 'x' } }]).exec());
    await expectBlocked(
      Thing.aggregate([{ $sort: { name: 1 } }, { $match: { businessId: tenant } }]).exec(),
    );
    await expectAllowed(
      Thing.aggregate([{ $match: { businessId: tenant } }, { $count: 'n' }]).exec(),
    );
    await expectAllowed(
      Thing.aggregate([{ $match: {} }])
        .option({ skipTenantGuard: true })
        .exec(),
    );
    await expectBlocked(
      Thing.aggregate([{ $match: {} }])
        .option({ middleware: false })
        .exec(),
    );
  });

  describe('aggregation stages that read or write other collections', () => {
    const scoped = { $match: { businessId: tenant } };
    const run = (stages: Record<string, unknown>[], options = {}) =>
      // Cast: Mongoose's stage types forbid some of these stages, e.g. $out inside $facet.
      Thing.aggregate([scoped, ...stages] as PipelineStage[])
        .option(options)
        .exec();
    const localLookup = {
      $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'c' },
    };
    const graphLookup = {
      $graphLookup: {
        from: 'things',
        startWith: '$_id',
        connectFromField: 'parent',
        connectToField: '_id',
        as: 'tree',
      },
    };

    const unsafe: [string, Record<string, unknown>[]][] = [
      ['$out', [{ $out: 'stolen' }]],
      ['$merge', [{ $merge: { into: 'stolen' } }]],
      ['$graphLookup', [graphLookup]],
      ['a localField $lookup', [localLookup]],
      ['a string $unionWith', [{ $unionWith: 'customers' }]],
      [
        'a $lookup pipeline without a businessId $match',
        [{ $lookup: { from: 'customers', pipeline: [{ $match: { name: 'x' } }], as: 'c' } }],
      ],
      ['$out inside $facet', [{ $facet: { copy: [{ $out: 'stolen' }] } }]],
      ['a localField $lookup inside $facet', [{ $facet: { joined: [localLookup] } }]],
      ['a string $unionWith inside $facet', [{ $facet: { all: [{ $unionWith: 'customers' }] } }]],
    ];

    it.each(unsafe)('rejects %s', async (_label, stages) => {
      await expectBlocked(run(stages));
    });

    it.each(unsafe)('allows %s when the guard is explicitly skipped', async (_label, stages) => {
      await expectAllowed(run(stages, { skipTenantGuard: true }));
    });

    it('allows $lookup and $unionWith pipelines that start with a $match on businessId', async () => {
      await expectAllowed(run([{ $lookup: { from: 'customers', pipeline: [scoped], as: 'c' } }]));
      await expectAllowed(run([{ $unionWith: { coll: 'customers', pipeline: [scoped] } }]));
      await expectAllowed(
        run([
          { $facet: { joined: [{ $lookup: { from: 'customers', pipeline: [scoped], as: 'c' } }] } },
        ]),
      );
    });

    it('names the model and stage in the error, never values', async () => {
      const error: unknown = await run([{ $unionWith: 'customers' }]).catch(
        (rejection: unknown) => rejection,
      );
      expect((error as Error).message).toBe(
        'Tenant guard: aggregate on TenantGuardTestThing: $unionWith must use a pipeline that starts with a $match on businessId',
      );
    });
  });

  it('checks every bulkWrite operation', async () => {
    await expectAllowed(
      Thing.bulkWrite([
        { insertOne: { document: { businessId: tenant, name: 'x' } } },
        { deleteMany: { filter: { businessId: tenant, name: 'y' } } },
      ]),
    );
    await expectBlocked(
      Thing.bulkWrite([
        { insertOne: { document: { businessId: tenant, name: 'x' } } },
        { deleteMany: { filter: { name: 'y' } } },
      ]),
    );
    await expectAllowed(
      Thing.bulkWrite([{ deleteMany: { filter: { name: 'y' } } }], { skipTenantGuard: true }),
    );
    await expectBlocked(
      Thing.bulkWrite(
        [{ updateMany: { filter: {}, update: { $set: { businessId: new Types.ObjectId() } } } }],
        { skipTenantGuard: true },
      ),
    );
  });

  it("scopes a loaded document's deleteOne and updateOne to its own business", async () => {
    const thing = Thing.hydrate({ _id: new Types.ObjectId(), businessId: tenant, name: 'x' });

    for (const write of [() => thing.deleteOne(), () => thing.updateOne({ name: 'y' })]) {
      const error: unknown = await write().then(
        () => undefined,
        (rejection: unknown) => rejection,
      );
      expect(error).toBeInstanceOf(ReachedDatabase);
      expect((error as ReachedDatabase).filter).toMatchObject({
        _id: thing._id,
        businessId: tenant,
      });
    }
  });

  it('rejects deleteOne on a document loaded without its businessId', async () => {
    const partial = Thing.hydrate({ _id: new Types.ObjectId(), name: 'x' });
    await expectBlocked(partial.deleteOne());
  });

  it('names the operation and model in the error, never the filter values', async () => {
    const secret = 'olivia.harper@example.com';
    const error: unknown = await Thing.findOne({ name: secret })
      .exec()
      .catch((rejection: unknown) => rejection);
    expect(error).toBeInstanceOf(TenantGuardError);
    expect((error as Error).message).toBe(
      'Tenant guard: findOne on TenantGuardTestThing must filter by businessId',
    );
  });
});

describe('application models', () => {
  const tenantModels: readonly (Pick<Model<TenantOwned>, 'modelName' | 'find'> & {
    schema: Schema;
  })[] = TENANT_MODELS;

  it.each(tenantModels.map((model) => [model.modelName, model] as const))(
    '%s is tenant-guarded',
    async (_name, model) => {
      expect(model.schema.path('businessId').options).toMatchObject({
        required: true,
        immutable: true,
      });
      await expect(model.find({}).exec()).rejects.toBeInstanceOf(TenantGuardError);
    },
  );

  it('Business is the tenant root and is not guarded', () => {
    expect(BusinessModel.schema.path('businessId')).toBeUndefined();
  });
});
