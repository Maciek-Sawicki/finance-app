import express from 'express';
import multer from "multer";
import { authenticate } from '../middleware/authenticate.js';
import {
  createImport,
  getImportTransactions,
  updateTransactionCategory,
  batchUpdateTransactionCategories,
  deleteImport
} from '../controllers/import.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticate, upload.single("file"), createImport);
router.get('/:id/transactions', authenticate, getImportTransactions);
router.patch('/transaction/:id/category', authenticate, updateTransactionCategory);
router.patch('/:id/categories', authenticate, batchUpdateTransactionCategories);
router.delete('/:id', authenticate, deleteImport);

export default router;
