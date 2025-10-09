import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getTopCategories,
  getMonthlyTopCategories,
  getYearlyTopCategories
} from '../controllers/categoryBreakdown.controller.js';

const router = express.Router();

router.get('/top-categories', authenticate, getTopCategories);
router.get('/top-monthly-categories', authenticate, getMonthlyTopCategories);
router.get('/top-yearly-categories', authenticate, getYearlyTopCategories);

export default router;
