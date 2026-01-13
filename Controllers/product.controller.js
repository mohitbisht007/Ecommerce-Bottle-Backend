import Product from "../Schemas/product.schema.js";
import slugify from "slugify";
import mongoose from "mongoose";

async function generateUniqueSlug(title) {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  // check duplicates
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export const productList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      q,
      sort,
      category,
      featured,
      maxPrice, 
      color, 
      capacity, 
      inStock,
    } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (q) filter.$text = { $search: String(q) };
    if (featured === "true" || featured === "1" || featured === true) {
      filter.featured = true;
    }

    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    if (color || capacity) {
      filter.variants = { $elemMatch: {} };
      if (color) filter.variants.$elemMatch.colorName = color;
      if (capacity) filter.variants.$elemMatch.capacity = capacity;
    }

    if (inStock === 'true') {
      // Find products where total stock > 0
      filter.stock = { $gt: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj =
      sort === "price_asc"
        ? { price: 1 }
        : sort === "price_desc"
        ? { price: -1 }
        : sort === "newest"
        ? { createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

/**
 * GET /api/products/:slug
 */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

/**
 * GET /api/products/id/:id  (admin helper)
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

export const getCategoriesWithImages = async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      category: { $ne: "" },
    });

    // For each category, find one product image
    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const product = await Product.findOne({ category: cat }).select(
          "image"
        );
        return {
          label: cat,
          image: product?.image || "/placeholder.jpg", // Fallback image
          queryParam: `category=${cat}`,
        };
      })
    );

    res.json({ categories: categoryData });
  } catch (err) {
    res.status(400).json(err.message);
  }
};

/**
 * POST /api/admin/products
 * Admin only
 */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description = "",
      category,
      compareAtPrice, // This can act as the "starting" strike-through price
      tags = [],
      variants = [], // Now expecting: [{colorName, colorCode, capacity, price, stock, images: []}]
      sku = "",
      featured = false,
    } = req.body;

    if (!title || variants.length === 0) {
      return res
        .status(400)
        .json({ message: "Title and at least one variant are required" });
    }

    const slug = await generateUniqueSlug(title);

    // 1. Calculate main price from the first variant (or cheapest)
    const mainPrice = Number(variants[0].price);

    // 2. Calculate total stock across all sizes/colors
    const totalStock = variants.reduce(
      (acc, curr) => acc + Number(curr.stock),
      0
    );

    // 3. Set thumbnail from first variant
    const thumbnail = variants[0]?.images[0] || "";

    const product = await Product.create({
      title: title.trim(),
      slug,
      description,
      category,
      price: mainPrice, // Base price for sorting
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      tags,
      variants, // Includes capacity, price, and stock for each variant
      thumbnail,
      sku,
      stock: totalStock, // Sum of all variant stocks
      featured: Boolean(featured),
    });

    res.status(201).json(product);
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

/**
 * PUT /api/admin/products/:id
 * Admin only
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.title) {
      data.slug = await generateUniqueSlug(data.title);
    }

    // Recalculate based on variants if they are being updated
    if (data.variants && data.variants.length > 0) {
      // Set price to the first variant's price
      data.price = Number(data.variants[0].price);

      // Recalculate total stock
      data.stock = data.variants.reduce(
        (acc, curr) => acc + Number(curr.stock),
        0
      );

      // Update thumbnail
      data.thumbnail = data.variants[0].images[0];
    }

    data.updatedAt = Date.now();

    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.json(updated);
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Admin only
 */
export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ ok: true });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

/**
 * GET /api/products/search?q=...
 * Small convenience wrapper if you want dedicated search route
 */
export const searchProduct = async (req, res) => {
  try {
    const { q = "", limit = 10 } = req.query;
    if (!q) return res.json({ items: [] });

    const items = await Product.find({ $text: { $search: String(q) } })
      .limit(Number(limit))
      .select("title slug price images tags stock");

    res.json({ items });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { category, productId, type } = req.query;

    let query = {};
    let limit = 4;

    if (type === "similar") {
      // Logic: Same category, different ID
      query = { category: category, _id: { $ne: productId } };
    } else {
      // Logic: Best Sellers or Different Category (Cross-sell)
      query = { _id: { $ne: productId }, featured: true };
      // Or: query = { category: { $ne: category } };
    }

    const products = await Product.find(query)
      .limit(limit)
      .sort({ rating: -1 });
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
