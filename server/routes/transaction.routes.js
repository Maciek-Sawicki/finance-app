import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTransaction,
  getTransaction
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.post('/create', authenticate, createTransaction);

router.get('/:id', authenticate, getTransaction);



export default router;
