import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTransaction,
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/create', authenticate, createTransaction);

export default router;
