import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getDefaultCategories,
} from '../controllers/category.controller.js';

const router = express.Router();

router.post('/create', authenticate, createCategory);
router.get('/', authenticate, getCategories);
router.get('/default', getDefaultCategories);

router.get('/:id', authenticate, getCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;
