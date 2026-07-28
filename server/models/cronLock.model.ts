import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

// One document per job name, used as a distributed mutex - see
// cron/withLock.ts. _id is the job name itself rather than an ObjectId.
const cronLockSchema = new Schema({
  _id: { type: String, required: true },
  lockedAt: { type: Date, required: true },
  lockedUntil: { type: Date, required: true },
});

export type CronLockAttrs = InferSchemaType<typeof cronLockSchema>;
export type CronLockDocument = HydratedDocument<CronLockAttrs>;

export default mongoose.model("CronLock", cronLockSchema);
