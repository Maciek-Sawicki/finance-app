import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { reportLimiter, publicRatesLimiter } from '../middleware/rateLimiters.js';
import {
  updateExchangeRates,
  convertAmount,
  getAvailableCurrencies,
  getPopularCurrencies,
  getExchangeRates
} from '../controllers/exchangeRate.controller.js';

const router = express.Router();

router.get('/', publicRatesLimiter, getExchangeRates);
router.post('/update', reportLimiter, authenticate, updateExchangeRates);
router.get('/convert', publicRatesLimiter, convertAmount);
router.get('/currencies', publicRatesLimiter, getAvailableCurrencies);
router.get('/currencies/popular', publicRatesLimiter, getPopularCurrencies);

export default router;