import cron from 'node-cron';
import { fetchAndSaveRates } from '../services/exchangeRate.service.js';
import { broadcastRates } from '../ws.js';

export const fetchRatesJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Cron: updating exchange rates...');
      const doc = await fetchAndSaveRates("USD");
      if (doc?.rates) broadcastRates(Object.fromEntries(doc.rates));
    } catch (err) {
      console.error('Cron error:', err);
    }
  });
};