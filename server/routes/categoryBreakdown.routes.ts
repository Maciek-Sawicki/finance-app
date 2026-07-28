import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMonthlyTopCategories,
  getYearlyTopCategories
} from '../controllers/categoryBreakdown.controller.js';
import { reportLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.get('/top-monthly-categories', reportLimiter, authenticate, getMonthlyTopCategories);
router.get('/top-yearly-categories', reportLimiter, authenticate, getYearlyTopCategories);

export default router;
