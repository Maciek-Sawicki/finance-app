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
// memoryStorage buffers the whole file in RAM before createImport ever runs,
// so an unbounded upload is a straightforward way to OOM the process.
// Exported so tests can exercise the exact real limit instead of duplicating it.
export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES } });

router.post('/', importLimiter, authenticate, upload.single("file"), createImport);
router.get('/', authenticate, getUserImports);
router.get('/:id/transactions', authenticate, getImportTransactions);
router.patch('/transactions/:transactionId/category', authenticate, updateTransactionCategory);
router.patch('/:id/categories', authenticate, batchUpdateTransactionCategories);
router.delete('/:id', authenticate, deleteImport);

export default router;
