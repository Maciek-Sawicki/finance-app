import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getMonthlySummary } from '../controllers/summary.controller.js';

const router = express.Router();

router.get('/dashboard-summary', authenticate, getMonthlySummary);

export default router;
