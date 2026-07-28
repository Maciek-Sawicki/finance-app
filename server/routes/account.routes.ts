import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  setDefaultAccount,
  getDefaultAccount,
  getAccountsByType,
  getAccountsByCurrency,
  getAccountBalance,
  getTotalBalance,
  getAccountSummary
} from '../controllers/account.controller.js';

const router = express.Router();

router.post('/', authenticate, createAccount);
router.get('/', authenticate, getAccounts);
router.get('/default', authenticate, getDefaultAccount);
router.get('/total-balance', authenticate, getTotalBalance);
router.get('/summary', authenticate, getAccountSummary);
router.get('/by-type/:type', authenticate, getAccountsByType);
router.get('/by-currency/:currency', authenticate, getAccountsByCurrency);

router.get('/:id', authenticate, getAccount);
router.put('/:id', authenticate, updateAccount);
router.delete('/:id', authenticate, deleteAccount);
router.post('/:id/default', authenticate, setDefaultAccount);
router.get('/:id/balance', authenticate, getAccountBalance);

export default router;
