import axios from 'axios';
import { createExchangeRateService } from '../services/exchangeRate.service.js';
import * as exchangeRateRepository from '../repositories/exchangeRate.repository.js';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

type ExchangeRateRepository = jest.Mocked<typeof exchangeRateRepository>;
type LatestDoc = Awaited<ReturnType<typeof exchangeRateRepository.findLatest>>;
type InsertedDoc = Awaited<ReturnType<typeof exchangeRateRepository.insertRates>>;

// The service is exercised against a fake repository (plain object, no
// Mongoose involved) instead of jest.mock()-ing a model. This is the payoff
// of the repository + factory split: business logic (caching, conversion
// math) is tested in isolation from the database.
const createFakeRepository = (): ExchangeRateRepository =>
  ({
    findLatest: jest.fn(),
    insertRates: jest.fn(),
  } as unknown as ExchangeRateRepository);

describe('exchangeRate.service', () => {
  afterEach(() => jest.clearAllMocks());

  describe('convertCurrency', () => {
    it('converts an amount using the latest stored rates', async () => {
      const repository = createFakeRepository();
      repository.findLatest.mockResolvedValue({ base: 'USD', rates: { USD: 1, EUR: 0.5, PLN: 4 } } as unknown as LatestDoc);
      const service = createExchangeRateService(repository);

      const result = await service.convertCurrency(100, 'USD', 'EUR');

      expect(result).toBe(50);
    });

    it('caches rates so repeated conversions do not re-query the repository', async () => {
      const repository = createFakeRepository();
      repository.findLatest.mockResolvedValue({ base: 'USD', rates: { USD: 1, EUR: 0.5, PLN: 4 } } as unknown as LatestDoc);
      const service = createExchangeRateService(repository);

      await service.convertCurrency(100, 'USD', 'EUR');
      await service.convertCurrency(200, 'USD', 'PLN');
      await service.convertCurrency(300, 'PLN', 'EUR');

      expect(repository.findLatest).toHaveBeenCalledTimes(1);
    });

    it('re-queries the repository once the cache entry expires', async () => {
      const repository = createFakeRepository();
      repository.findLatest.mockResolvedValue({ base: 'USD', rates: { USD: 1, EUR: 0.5 } } as unknown as LatestDoc);
      const service = createExchangeRateService(repository, { cacheTtlMs: 10 });

      await service.convertCurrency(100, 'USD', 'EUR');
      await new Promise((resolve) => setTimeout(resolve, 20));
      await service.convertCurrency(100, 'USD', 'EUR');

      expect(repository.findLatest).toHaveBeenCalledTimes(2);
    });

    it('throws for an unsupported currency', async () => {
      const repository = createFakeRepository();
      repository.findLatest.mockResolvedValue({ base: 'USD', rates: { USD: 1, EUR: 0.5 } } as unknown as LatestDoc);
      const service = createExchangeRateService(repository);

      await expect(service.convertCurrency(100, 'USD', 'XYZ')).rejects.toThrow('Unsupported currency');
    });

    it('throws when no rates document exists yet', async () => {
      const repository = createFakeRepository();
      repository.findLatest.mockResolvedValue(null);
      const service = createExchangeRateService(repository);

      await expect(service.convertCurrency(100, 'USD', 'EUR')).rejects.toThrow('No exchange rates found.');
    });
  });

  describe('fetchAndSaveRates', () => {
    it('persists fetched rates and primes the cache', async () => {
      const repository = createFakeRepository();
      repository.insertRates.mockImplementation(async (doc) => ({ ...doc, _id: 'new-id' } as unknown as InsertedDoc));
      mockedAxios.get.mockResolvedValue({ data: { base: 'USD', date: '2026-07-24', rates: { USD: 1, EUR: 0.5 } } });

      const service = createExchangeRateService(repository);
      const saved = await service.fetchAndSaveRates('USD');

      expect(repository.insertRates).toHaveBeenCalledWith({
        base: 'USD',
        rates: { USD: 1, EUR: 0.5 },
        date: new Date('2026-07-24'),
      });
      expect((saved as unknown as { _id: string })._id).toBe('new-id');

      // Cache should now be primed, so a conversion right after doesn't hit the repository.
      const result = await service.convertCurrency(100, 'USD', 'EUR');
      expect(result).toBe(50);
      expect(repository.findLatest).not.toHaveBeenCalled();
    });

    it('throws when the external API returns no rates', async () => {
      const repository = createFakeRepository();
      mockedAxios.get.mockResolvedValue({ data: {} });
      const service = createExchangeRateService(repository);

      await expect(service.fetchAndSaveRates('USD')).rejects.toThrow('Failed to fetch exchange rates.');
      expect(repository.insertRates).not.toHaveBeenCalled();
    });
  });
});
