import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get("/me", authenticate, getSettings);
router.patch("/me", authenticate, updateSettings);

export default router;