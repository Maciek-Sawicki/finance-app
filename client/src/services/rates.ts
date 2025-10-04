import api from "@/lib/api";

export type Rates = Record<string, number>;

const LOCAL_STORAGE_KEY = "rates_cache";

interface RatesCache {
  rates: Rates;
  date: string;
}

export const RatesService = {
  getRates: async (): Promise<Rates> => {
    const today = new Date().toISOString().slice(0, 10);
    const cacheStr = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (cacheStr) {
      try {
        const cache: RatesCache = JSON.parse(cacheStr);
        if (cache.date === today) {
          return cache.rates;
        }
      } catch (e) {
        console.warn("Invalid rates cache, refetching...");
      }
    }

    const res = await api.get("/rates");
    const rates: Rates = res.data.rates;

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ rates, date: today })
    );

    return rates;
  },

  convert: async (amount: number, from: string, to: string): Promise<number> => {
    const rates = await RatesService.getRates();

    if (!rates[from] || !rates[to]) {
      throw new Error(`Rate not found for ${from} or ${to}`);
    }

    return (amount / rates[from]) * rates[to];
  },

  getExchangeRate: async (from: string, to: string): Promise<number> => {
    const rates = await RatesService.getRates();

    if (!rates[from] || !rates[to]) {
      throw new Error(`Rate not found for ${from} or ${to}`);
    }

    return rates[to] / rates[from];
  },

  refreshRates: async (): Promise<Rates> => {
    const res = await api.get("/rates");
    const rates: Rates = res.data.rates;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ rates, date: today })
    );
    return rates;
  },
};
