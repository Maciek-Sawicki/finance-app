import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { signUp, signIn, signOut, getCurrentUser } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);

export default router;