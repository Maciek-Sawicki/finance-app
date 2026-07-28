import * as categoryRepository from '../repositories/category.repository.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon } = req.body;
  const userId = req.user._id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required.' });
  }

  const existing = await categoryRepository.findByNameAndType(userId, name, type);
  if (existing) {
    return res.status(409).json({ message: 'Category already exists.' });
  }

  const newCategory = await categoryRepository.create({ userId, name, type, icon });
  res.status(201).json({ message: 'Category created successfully', category: newCategory });
});

export const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const categories = await categoryRepository.findByUser(userId);

  res.status(200).json(categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryRepository.findById(req.user._id, req.params.id as string);
  if (!category) {
    return res.status(404).json({ message: 'Category not found.' });
  }
  res.status(200).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color, favorite } = req.body;
  const updateData: { name?: string; type?: string; icon?: string; color?: string; favorite?: boolean } = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (favorite !== undefined) updateData.favorite = favorite;

  const updated = await categoryRepository.updateById(req.user._id, req.params.id as string, updateData);

  if (!updated) {
    return res.status(404).json({ message: 'Category not found or not authorized.' });
  }

  res.status(200).json({ message: 'Category updated successfully', category: updated });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const deleted = await categoryRepository.deleteById(req.user._id, req.params.id as string);

  if (!deleted) {
    return res.status(404).json({ message: 'Category not found or not authorized.' });
  }

  res.status(200).json({ message: 'Category deleted successfully' });
});

export const getFavoriteCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const favorites = await categoryRepository.findByUser(userId, { favorite: true });

  res.status(200).json(favorites);
});
