import express from 'express';
import { 
  updateExchangeRates,
  convertAmount
} from '../controllers/exchangeRate.controller.js';

const router = express.Router();

router.post('/update', updateExchangeRates);
router.get('/convert', convertAmount);

export default router;