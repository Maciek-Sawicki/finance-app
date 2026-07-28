import axios from "axios";
import * as exchangeRateRepository from "../repositories/exchangeRate.repository.js";

const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // matches fetchRatesJob's cron cadence

interface ExchangeRateApiResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CacheEntry {
  rates: Record<string, number>;
  fetchedAt: number;
}

type ExchangeRateRepository = typeof exchangeRateRepository;

// Factory instead of a hard-coded singleton so tests can inject a fake
// repository and get their own isolated cache, without mocking Mongoose.
export const createExchangeRateService = (
  repository: ExchangeRateRepository,
  { cacheTtlMs = DEFAULT_CACHE_TTL_MS }: { cacheTtlMs?: number } = {}
) => {
  const cache = new Map<string, CacheEntry>();
  const isFresh = (entry?: CacheEntry): boolean => Boolean(entry) && Date.now() - entry!.fetchedAt < cacheTtlMs;

  const fetchAndSaveRates = async (baseCurrency = "USD") => {
    const { data } = await axios.get<ExchangeRateApiResponse>(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    if (!data?.rates) {
      throw new Error("Failed to fetch exchange rates.");
    }

    const saved = await repository.insertRates({
      base: data.base,
      rates: data.rates,
      date: new Date(data.date),
    });

    cache.set(data.base, { rates: data.rates, fetchedAt: Date.now() });
    return saved;
  };

  // Returns just the { [currencyCode]: rate } map for a base currency, cached
  // for cacheTtlMs so a request that converts hundreds of transactions doesn't
  // hit the database once per conversion.
  const getRates = async (baseCurrency: string): Promise<Record<string, number>> => {
    const cached = cache.get(baseCurrency);
    if (isFresh(cached)) return cached!.rates;

    const doc = await repository.findLatest({ base: baseCurrency });
    if (!doc) throw new Error("No exchange rates found.");

    cache.set(baseCurrency, { rates: doc.rates, fetchedAt: Date.now() });
    return doc.rates;
  };

  // Full ExchangeRate document (base/date/rates), for endpoints that need the
  // envelope rather than just the rates. Deliberately not cached: it's read
  // rarely (currency browsing), unlike convertCurrency's hot path.
  const getLatestDocument = (baseCurrency?: string) =>
    repository.findLatest(baseCurrency ? { base: baseCurrency } : {});

  const convertCurrency = async (amount: number, from: string, to: string, baseCurrency = "USD"): Promise<number> => {
    const rates = await getRates(baseCurrency);

    const rateFrom = Number(rates[from]);
    const rateTo = Number(rates[to]);
    if (!rateFrom || !rateTo) {
      throw new Error(`Unsupported currency: ${from} or ${to}`);
    }

    return Number(((amount / rateFrom) * rateTo).toFixed(2));
  };

  return { fetchAndSaveRates, getRates, getLatestDocument, convertCurrency };
};

export type CurrencyService = ReturnType<typeof createExchangeRateService>;

const defaultService = createExchangeRateService(exchangeRateRepository);

export const fetchAndSaveRates = defaultService.fetchAndSaveRates;
export const getRates = defaultService.getRates;
export const getLatestDocument = defaultService.getLatestDocument;
export const convertCurrency = defaultService.convertCurrency;
