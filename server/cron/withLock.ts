import CronLock from "../models/cronLock.model.js";

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;

// Distributed lock for cron jobs that may run across multiple server
// replicas. Without this, every replica's node-cron schedule fires
// independently - for recurringTransactionsJob that means a duplicate real
// Transaction document per due recurring rule, once per replica.
//
// Backed by Mongo (already the app's only infra dependency) instead of
// adding Redis just for this: findOneAndUpdate's atomic upsert doubles as a
// compare-and-swap. Exactly one of these outcomes happens per call:
//  - no lock document exists yet -> this call inserts one and wins
//  - the existing lock is expired (lockedUntil < now) -> this call updates
//    it in place and wins
//  - the existing lock is still held -> the upsert's implicit insert
//    attempt collides with the existing _id and throws a duplicate-key
//    error, which we read as "someone else has it, skip this tick"
// A crashed holder is recovered automatically once lockedUntil passes -
// there's no explicit release, which keeps this safe against a process
// dying mid-job instead of leaving the lock stuck forever.
export const withLock = async (jobName: string, ttlMs: number, fn: () => Promise<void>): Promise<void> => {
  const now = new Date();

  try {
    await CronLock.findOneAndUpdate(
      { _id: jobName, lockedUntil: { $lt: now } },
      { $set: { lockedAt: now, lockedUntil: new Date(now.getTime() + ttlMs) } },
      { upsert: true }
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      console.log(`Cron: skipping '${jobName}' - lock held by another instance.`);
      return;
    }
    throw err;
  }

  await fn();
};
