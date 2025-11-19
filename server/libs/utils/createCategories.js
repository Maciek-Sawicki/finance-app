import Category from '../../models/category.model.js';

export const initDefaultCategoriesForUser = async (userId) => {
  const defaultCategories = [
    { name: "Food", type: "expense", icon: "🍔", color: "#FF6B6B" },
    { name: "Transport", type: "expense", icon: "🚌", color: "#4ECDC4" },
    { name: "Entertainment", type: "expense", icon: "🎬", color: "#556270" },
    { name: "Shopping", type: "expense", icon: "🛍️", color: "#C7F464" },
    { name: "Health", type: "expense", icon: "💊", color: "#FF6B6B" },
    { name: "Salary", type: "income", icon: "💰", color: "#1A535C" },
    { name: "Investments", type: "income", icon: "📈", color: "#4ECDC4" },
    { name: "Gift", type: "income", icon: "🎁", color: "#FF6B6B" },
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
