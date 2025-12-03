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
    const { page = 1, limit = 12, q, sort } = req.query;
    const filter = {};

    if (q) filter.$text = { $search: String(q) };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj =
      sort === 'price_asc' ? { price: 1 } :
      sort === 'price_desc' ? { price: -1 } :
      sort === 'newest' ? { createdAt: -1 } :
      { createdAt: -1 };

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
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
    if (!product) return res.status(404).json({ message: 'Product not found' });
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
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    return res.status(400).json(err.message);
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
      description = '',
      price,
      compareAtPrice,
      tags = [],
      images = [],
      sku = '',
      stock = 0,
      featured = false
    } = req.body;

    if (!title || price == null) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const slug = await generateUniqueSlug(title);
    const product = await Product.create({
      title: title.trim(),
      slug,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      tags,
      images,
      sku,
      stock: Number(stock),
      featured: Boolean(featured)
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
      data.slug = await generateUniqueSlug(Product, data.title, id);
    }

    if (data.price != null) data.price = Number(data.price);
    if (data.compareAtPrice != null) data.compareAtPrice = Number(data.compareAtPrice);
    if (data.stock != null) data.stock = Number(data.stock);

    data.updatedAt = Date.now();

    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });

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
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
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
    const { q = '', limit = 10 } = req.query;
    if (!q) return res.json({ items: [] });

    const items = await Product.find({ $text: { $search: String(q) } })
      .limit(Number(limit))
      .select('title slug price images tags stock');

    res.json({ items });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};