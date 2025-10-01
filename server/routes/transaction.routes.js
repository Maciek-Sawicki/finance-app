import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTransaction,
  createTransfer,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  toggleTransactionSettled
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/create', authenticate, createTransaction);
router.post('/transfer', authenticate, createTransfer);
router.get('/', authenticate, getTransactions);

router.get('/:id', authenticate, getTransaction);
router.put('/:id', authenticate, updateTransaction);
router.delete('/:id', authenticate, deleteTransaction);
router.patch('/:id/toggle-settled', authenticate, toggleTransactionSettled);

export default router;
