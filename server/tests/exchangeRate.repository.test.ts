import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as exchangeRateRepository from '../repositories/exchangeRate.repository.js';
import ExchangeRate from '../models/exchangeRate.model.js';

// Integration test against a real (in-memory) MongoDB: this is what catches
// things a mocked Mongoose model can't, e.g. that .lean() turns the schema's
// Map field into a plain object rather than a Mongoose Map.
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
  await ExchangeRate.deleteMany({});
});

describe('exchangeRate.repository', () => {
  describe('insertRates', () => {
    it('creates a document with the given base, rates and date', async () => {
      const saved = await exchangeRateRepository.insertRates({
        base: 'USD',
        rates: { EUR: 0.5, PLN: 4 },
        date: new Date('2026-07-24'),
      });

      expect(saved.base).toBe('USD');
      expect(saved.rates.get('EUR')).toBe(0.5);

      const count = await ExchangeRate.countDocuments();
      expect(count).toBe(1);
    });
  });

  describe('findLatest', () => {
    it('returns the most recently created document for a given base', async () => {
      await exchangeRateRepository.insertRates({ base: 'USD', rates: { EUR: 0.5 }, date: new Date('2026-07-01') });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await exchangeRateRepository.insertRates({ base: 'USD', rates: { EUR: 0.51 }, date: new Date('2026-07-24') });

      const latest = await exchangeRateRepository.findLatest({ base: 'USD' });

      expect(latest!.rates.EUR).toBe(0.51);
    });

    it('returns a plain object for the rates field, not a Mongoose Map', async () => {
      await exchangeRateRepository.insertRates({ base: 'USD', rates: { EUR: 0.5 }, date: new Date() });

      const latest = await exchangeRateRepository.findLatest({ base: 'USD' });

      expect(latest!.rates instanceof Map).toBe(false);
      expect(latest!.rates.EUR).toBe(0.5);
    });

    it('returns null when no document matches the filter', async () => {
      const latest = await exchangeRateRepository.findLatest({ base: 'DOES_NOT_EXIST' });
      expect(latest).toBeNull();
    });

    it('ignores the base filter when none is provided', async () => {
      await exchangeRateRepository.insertRates({ base: 'EUR', rates: { USD: 2 }, date: new Date() });

      const latest = await exchangeRateRepository.findLatest();

      expect(latest!.base).toBe('EUR');
    });
  });
});
