import mongoose from 'mongoose';
import Category from '../../models/category.model.js';
import type { SessionOption } from '../../types/common.js';

// Errors here used to be swallowed (caught and only console.error'd), which
// left a real, working user account with zero categories and nothing
// surfaced to the caller. Now propagates so the caller (auth.service.ts's
// signUp transaction) can roll the whole sign-up back instead.
export const initDefaultCategoriesForUser = async (
  userId: mongoose.Types.ObjectId | string,
  { session }: SessionOption = {}
): Promise<void> => {
  const defaultCategories = [
    { name: "Food", type: "expense", icon: "🍔" },
    { name: "Transport", type: "expense", icon: "🚌" },
    { name: "Entertainment", type: "expense", icon: "🎬" },
    { name: "Shopping", type: "expense", icon: "🛍️" },
    { name: "Health", type: "expense", icon: "💊" },
    { name: "Salary", type: "income", icon: "💰" },
    { name: "Investments", type: "income", icon: "📈" },
    { name: "Gift", type: "income", icon: "🎁" },
  ];

  const categoriesToInsert = defaultCategories.map(cat => ({
    ...cat,
    userId,
  }));

  await Category.insertMany(categoriesToInsert, { session });
};
