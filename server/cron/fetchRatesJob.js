import cron from 'node-cron';
import { fetchAndSaveRates } from '../services/exchangeRate.service.js';

export const fetchRatesJob = () => {
  cron.schedule('0 */12 * * *', async () => {
    try {
      console.log('Cron: updating exchange rates...');
      await fetchAndSaveRates("USD");
    } catch (err) {
      console.error('Cron error:', err);
    }
  });
};