import express from 'express';
import { getSettings, createSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.post('/create', authenticate, createSettings);
router.put('/update', authenticate, updateSettings);

export default router;