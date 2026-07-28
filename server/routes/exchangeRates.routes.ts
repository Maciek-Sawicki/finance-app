import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { reportLimiter } from '../middleware/rateLimiters.js';
import {
  updateExchangeRates,
  convertAmount,
  getAvailableCurrencies,
  getPopularCurrencies,
  getExchangeRates
} from '../controllers/exchangeRate.controller.js';

const router = express.Router();

router.get('/', getExchangeRates);
router.post('/update', reportLimiter, authenticate, updateExchangeRates);
router.get('/convert', convertAmount);
router.get('/currencies', getAvailableCurrencies);
router.get('/currencies/popular', getPopularCurrencies);

export default router;