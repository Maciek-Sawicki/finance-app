import cron from 'node-cron';
import { fetchAndSaveRates } from '../services/exchangeRate.service.js';
import { withLock } from './withLock.js';

const LOCK_TTL_MS = 5 * 60 * 1000; // one HTTP call + one insert - 5 minutes is generous

export const fetchRatesJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      await withLock('fetchRatesJob', LOCK_TTL_MS, async () => {
        console.log('Cron: updating exchange rates...');
        await fetchAndSaveRates("USD");
      });
    } catch (err) {
      console.error('Cron error:', err);
    }
  });
};
