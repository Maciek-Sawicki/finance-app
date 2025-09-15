import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  toggleTransactionSettled
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/create', authenticate, createTransaction);
router.get('/', authenticate, getTransactions);

router.get('/:id', authenticate, getTransaction);
router.put('/:id', authenticate, updateTransaction);
router.delete('/:id', authenticate, deleteTransaction);
router.post('/:id/toggle-settled', authenticate, toggleTransactionSettled);

export default router;
