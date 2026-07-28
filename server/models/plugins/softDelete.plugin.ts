import type { Aggregate, MongooseDefaultQueryMiddleware, Query, Schema } from "mongoose";

// schema.add() at runtime doesn't widen the static type Schema<T> was
// constructed with, so InferSchemaType<typeof someSchema> won't see these
// fields on its own - each model intersects its Attrs type with this.
export interface SoftDeleteAttrs {
  isDeleted: boolean;
  deletedAt: Date | null;
}

// Applied per-schema so "hide deleted docs" is enforced in one place instead
// of at each of the ~30 find/aggregate call sites across repositories and
// controllers. Actual deletion is still opt-in per repository via
// softDeleteUpdate() below - this plugin only ever filters reads.
const EXCLUDE_DELETED = { isDeleted: { $ne: true } } as const;

const FILTERED_QUERY_OPS: MongooseDefaultQueryMiddleware[] = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
  "countDocuments",
  "updateMany",
  "updateOne",
];

export const softDeletePlugin = (schema: Schema): void => {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  });

  // A caller that explicitly filters on isDeleted (e.g. a test asserting a
  // doc was soft-deleted) opts out of the auto-filter instead of being
  // fought by it.
  schema.pre(FILTERED_QUERY_OPS, function (this: Query<unknown, unknown>) {
    const filter = this.getFilter();
    if (!("isDeleted" in filter)) {
      this.where(EXCLUDE_DELETED);
    }
  });

  schema.pre("aggregate", function (this: Aggregate<unknown[]>) {
    const pipeline = this.pipeline();
    const alreadyFiltered = pipeline.some(
      (stage): stage is { $match: Record<string, unknown> } =>
        typeof stage === "object" && stage !== null && "$match" in stage &&
        !!(stage as { $match?: unknown }).$match &&
        "isDeleted" in (stage as { $match: Record<string, unknown> }).$match
    );
    if (!alreadyFiltered) pipeline.unshift({ $match: EXCLUDE_DELETED });
  });
};

// Shared update fragment for repositories' deleteById-style methods, so how
// a delete actually mutates a document is defined once.
export const softDeleteUpdate = () => ({
  $set: { isDeleted: true, deletedAt: new Date() },
});
