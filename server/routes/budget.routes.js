import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { 
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getActiveBudgets,
  getBudgetHistory
} from '../controllers/budget.controller.js'

const router = express.Router();

router.get('/', authenticate, getBudgets);
router.post('/create', authenticate, createBudget);
router.get('/active', authenticate, getActiveBudgets);

router.get('/:id', authenticate, getBudgetById);
router.put('/:id', authenticate, updateBudget);
router.delete('/:id', authenticate, deleteBudget);
router.get('/history/:id', authenticate, getBudgetHistory);

export default router;