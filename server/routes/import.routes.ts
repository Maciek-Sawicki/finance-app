import express from 'express';
import multer from "multer";
import { authenticate } from '../middleware/authenticate.js';
import { importLimiter } from '../middleware/rateLimiters.js';
import {
  createImport,
  getImportTransactions,
  getUserImports,
  updateTransactionCategory,
  batchUpdateTransactionCategories,
  deleteImport
} from '../controllers/import.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', importLimiter, authenticate, upload.single("file"), createImport);
router.get('/', authenticate, getUserImports);
router.get('/:id/transactions', authenticate, getImportTransactions);
router.patch('/transactions/:transactionId/category', authenticate, updateTransactionCategory);
router.patch('/:id/categories', authenticate, batchUpdateTransactionCategories);
router.delete('/:id', authenticate, deleteImport);

export default router;
