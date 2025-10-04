import express from 'express';
import { 
  updateExchangeRates,
  convertAmount,
  getAvailableCurrencies,
  getPopularCurrencies,
  getExchangeRates
} from '../controllers/exchangeRate.controller.js';

const router = express.Router();

router.get('/', getExchangeRates);
router.post('/update', updateExchangeRates);
router.get('/convert', convertAmount);
router.get('/currencies', getAvailableCurrencies);
router.get('/currencies/popular', getPopularCurrencies);

export default router;