import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTransaction,
  getAccountTransactionSummary,
  getAllAccountsTransactionSummary,
  getTransaction
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/create', authenticate, createTransaction);
router.get('/account-summary', authenticate, getAccountTransactionSummary);
router.get('/summary', authenticate, getAllAccountsTransactionSummary);

router.get('/:id', authenticate, getTransaction);



export default router;
