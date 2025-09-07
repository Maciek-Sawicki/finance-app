import Category from '../models/category.model.js';

export const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color, isDefault } = req.body;
    const userId = req.user._id;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required.' });
    }    

    const newCategory = new Category({
      userId,
      name,
      type,
      icon,
      color,
      isDefault
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = await Category.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(categories); 
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Category not found or not authorized.' });
    }

    res.status(200).json({ message: 'Category updated successfully', category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found or not authorized.' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getDefaultCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDefault: true }).sort({ createdAt: -1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching default categories:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const initDefaultCategoriesForUser = async (userId) => {
  try {
    const defaultCategories = await Category.find({ isDefault: true });

    if (!defaultCategories.length) {
      console.log("No default categories found.");
      return;
    }

    const userCategories = defaultCategories.map(cat => ({
      userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: false, 
    }));

    await Category.insertMany(userCategories);
    console.log(`Default categories initialized for user ${userId}`);
  } catch (error) {
    console.error("Error initializing default categories:", error);
  }
};
