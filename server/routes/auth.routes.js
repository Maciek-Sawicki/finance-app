import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { signUp, signIn, signOut, getCurrentUser } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);
router.get('/me', authenticate, getCurrentUser);

export default router;