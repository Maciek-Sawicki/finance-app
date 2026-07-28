import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction, 
} from '../controllers/recurringTransaction.controller.js';

const router = express.Router();

router.get('/', authenticate, getRecurringTransactions);
router.get('/:id', authenticate, getRecurringTransaction);
router.post('/', authenticate, createRecurringTransaction);
router.put('/:id', authenticate, updateRecurringTransaction);
router.delete('/:id', authenticate, deleteRecurringTransaction);
router.patch('/:id/toggle', authenticate, toggleRecurringTransaction);

export default router;
