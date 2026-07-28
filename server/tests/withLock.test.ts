import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { withLock } from '../cron/withLock.js';
import CronLock from '../models/cronLock.model.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await CronLock.deleteMany({});
});

describe('withLock', () => {
  it('runs the job and persists a lock document on first call', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    await withLock('job1', 60_000, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    const lock = await CronLock.findById('job1').lean();
    expect(lock).not.toBeNull();
    expect(lock!.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('only lets one of several concurrent callers run the job - simulating multiple replicas ticking at once', async () => {
    const fn = jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 20)));

    await Promise.all([
      withLock('job1', 60_000, fn),
      withLock('job1', 60_000, fn),
      withLock('job1', 60_000, fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not run the job again while a previous lock is still valid', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    await withLock('job1', 60_000, fn);
    await withLock('job1', 60_000, fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('lets a new caller acquire the lock once the previous one has expired', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    await withLock('job1', 10, fn);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await withLock('job1', 10, fn);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('keeps locks for different job names independent', async () => {
    const fnA = jest.fn().mockResolvedValue(undefined);
    const fnB = jest.fn().mockResolvedValue(undefined);

    await Promise.all([withLock('jobA', 60_000, fnA), withLock('jobB', 60_000, fnB)]);

    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it('propagates an error from the job without leaving the lock stuck past its TTL', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(withLock('job1', 10, failing)).rejects.toThrow('boom');

    // lock was still acquired (job ran, then threw) - confirm a later caller
    // can still get in once it expires, i.e. nothing is permanently stuck.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const fn = jest.fn().mockResolvedValue(undefined);
    await withLock('job1', 10, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
