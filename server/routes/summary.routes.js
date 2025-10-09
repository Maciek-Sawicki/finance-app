import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getAccountTransactionSummary,
  getAllAccountsTransactionSummary,
  getAccountCategorySummary,
  getBalanceSummary,
  getCashFlowSummary,
  getTrendsSummary,
  getMonthlyTrends,
  getTopCategories,
  getSavingsRate
} from '../controllers/summary.controller.js';

const router = express.Router();

router.get('/account-summary', authenticate, getAccountTransactionSummary);
router.get('/summary', authenticate, getAllAccountsTransactionSummary);
router.get('/category-summary', authenticate, getAccountCategorySummary);
router.get('/balance-summary', authenticate, getBalanceSummary);
router.get('/cashflow-summary', authenticate, getCashFlowSummary);
router.get('/trends-summary', authenticate, getTrendsSummary);
router.get('/monthly-trends', authenticate, getMonthlyTrends);
router.get('/top-categories', authenticate, getTopCategories);
router.get('/savings-rate', authenticate, getSavingsRate);

export default router;
