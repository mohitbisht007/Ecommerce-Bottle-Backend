import Category from "../Schemas/category.schema.js";

// 1. ADD NEW CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { displayName, image } = req.body;

    // Create a URL-friendly name (slug)
    // e.g., "Steel Bottles" -> "steel-bottles"
    const name = displayName
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    const newCategory = new Category({
      name,
      displayName,
      image,
      order: req.body.order || 0
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// 2. GET ALL CATEGORIES (For Admin & Homepage)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 4. UPDATE CATEGORY (Optional but useful for reordering)
export const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json({ success: true, category: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};