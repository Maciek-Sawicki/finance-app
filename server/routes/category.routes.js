import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getFavoriteCategories,
} from '../controllers/category.controller.js';

const router = express.Router();

router.post('/create', authenticate, createCategory);
router.get('/', authenticate, getCategories);
router.get('/favorites', authenticate, getFavoriteCategories);

router.get('/:id', authenticate, getCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;
