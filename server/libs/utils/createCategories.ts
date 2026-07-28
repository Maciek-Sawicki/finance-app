import mongoose from 'mongoose';
import Category from '../../models/category.model.js';

export const initDefaultCategoriesForUser = async (userId: mongoose.Types.ObjectId | string): Promise<void> => {
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

  try {
    await Category.insertMany(categoriesToInsert);
    console.log("Default categories created for user:", userId);
  } catch (err) {
    console.error("Error creating default categories:", err);
  }
};
