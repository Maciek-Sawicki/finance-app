import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMonthlyTopCategories,
  getYearlyTopCategories
} from '../controllers/categoryBreakdown.controller.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();


const categoryBreakdownLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: { message: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});


router.get('/top-monthly-categories', authenticate, getMonthlyTopCategories);
router.get('/top-yearly-categories', categoryBreakdownLimiter, authenticate, getYearlyTopCategories);

export default router;
