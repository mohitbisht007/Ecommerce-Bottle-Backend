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
      sort = "newest",
      category,
      featured,
      maxPrice,
      color,
      capacity,
      material,
      feature,
      inStock,
      customizable,
      minRating,
    } = req.query;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(48, Math.max(1, Number.parseInt(limit, 10) || 12));
    const filter = {};

    if (category) filter.category = String(category);
    if (q && String(q).trim()) filter.$text = { $search: String(q).trim() };
    if (featured === "true" || featured === "1") filter.featured = true;
    if (customizable === "true") filter.isCustomizable = true;

    // Price is maintained as the minimum variant-size price on create/update.
    // Legacy records should have this field recalculated once to keep this accurate.
    if (maxPrice && Number.isFinite(Number(maxPrice))) {
      filter.price = { $lte: Math.max(0, Number(maxPrice)) };
    }

    if (minRating && Number.isFinite(Number(minRating))) {
      filter.rating = { $gte: Number(minRating) };
    }

    const selectedColors = color ? String(color).split(",").map((v) => v.trim()).filter(Boolean) : [];
    const selectedCapacities = capacity ? String(capacity).split(",").map((v) => v.trim()).filter(Boolean) : [];

    // One variant must satisfy both color and capacity when both are selected.
    if (selectedColors.length || selectedCapacities.length || inStock === "true") {
      const variantMatch = {};
      if (selectedColors.length) variantMatch.baseColorName = { $in: selectedColors };
      if (selectedCapacities.length) variantMatch["sizes.capacity"] = { $in: selectedCapacities };
      if (inStock === "true") variantMatch["sizes.stock"] = { $gt: 0 };
      filter.variants = { $elemMatch: variantMatch };
    } else if (inStock === "true") {
      filter["variants.sizes.stock"] = { $gt: 0 };
    }

    const selectedMaterials = material ? String(material).split(",").map((v) => v.trim()).filter(Boolean) : [];
    if (selectedMaterials.length) {
      filter["specifications.material"] = { $in: selectedMaterials };
    }

    const selectedFeatures = feature ? String(feature).split(",").map((v) => v.trim()).filter(Boolean) : [];
    const featureConditions = {
      insulated: { "specifications.insulation": { $nin: ["", null, "None", "No"] } },
      leakproof: { "specifications.leakproof": true },
      dishwasherSafe: { "specifications.dishwasherSafe": true },
      rustProof: { "specifications.rustProof": true },
      condensationFree: { "specifications.condensationFree": true },
      carHolderFit: { "specifications.carHolderFit": true },
    };
    for (const selectedFeature of selectedFeatures) {
      const condition = featureConditions[selectedFeature];
      if (condition) Object.assign(filter, condition);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
      rating_desc: { rating: -1, reviewsCount: -1, createdAt: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;
    const skip = (pageNumber - 1) * pageSize;

    // Facets are built from the catalogue, not just the current page, so the
    // filter options remain stable as customers paginate or filter products.
    const [items, total, colorFacets, capacityFacets, materialFacets, maxPriceRecord] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(pageSize).lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $unwind: "$variants" },
        { $match: { "variants.baseColorName": { $nin: ["", null] }, "variants.colorCode": { $nin: ["", null] } } },
        { $group: { _id: "$variants.baseColorName", hex: { $first: "$variants.colorCode" } } },
        { $sort: { _id: 1 } },
      ]),
      Product.distinct("variants.sizes.capacity", { "variants.sizes.capacity": { $nin: ["", null] } }),
      Product.distinct("specifications.material", { "specifications.material": { $nin: ["", null] } }),
      Product.findOne({}).sort({ price: -1 }).select("price").lean(),
    ]);

    const filters = {
      colors: colorFacets.map((item) => ({ baseColorName: item._id, hex: item.hex })),
      capacities: capacityFacets.filter(Boolean).sort((a, b) => {
        const toMl = (value) => {
          const match = String(value).toLowerCase().match(/([\d.]+)\s*(ml|l)?/);
          if (!match) return Number.MAX_SAFE_INTEGER;
          const amount = Number(match[1]);
          return match[2] === "l" ? amount * 1000 : amount;
        };
        return toMl(a) - toMl(b);
      }),
      materials: materialFacets.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))),
      maxPrice: Number(maxPriceRecord?.price) || 5000,
    };

    return res.json({
      items,
      total,
      page: pageNumber,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      filters,
    });
  } catch (error) {
    console.error("PRODUCT LIST ERROR:", error);
    return res.status(500).json({ message: "Unable to fetch products." });
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
      compareAtPrice,
      tags = [],
      variants = [],
      sku = "",
      featured = false,

      specifications = {},
      isCustomizable = false,
      customizationOptions = {}
    } = req.body;

    if (!title || variants.length === 0) {
      return res.status(400).json({
        message: "Title and at least one variant are required"
      });
    }

    const slug = await generateUniqueSlug(title);

    // ✅ Normalize variants (important)
    const normalizedVariants = variants.map((v) => ({
      baseColorName: v.baseColorName || "",
      colorName: v.colorName || "",
      colorCode: v.colorCode || "#000000",

      images: v.images || [],

      engravingColorType:
        v.engravingColorType || "light",

      sizes: (v.sizes || []).map((s) => ({
        capacity: s.capacity || "",

        price: Number(s.price) || 0,

        compareAtPrice: s.compareAtPrice
          ? Number(s.compareAtPrice)
          : undefined,

        stock: Number(s.stock) || 0
      }))
    }));

    // ✅ Price logic (better: use MIN price, not first)
    const allPrices = normalizedVariants.flatMap(v =>
      v.sizes.map(s => s.price)
    );

    const validPrices = allPrices.filter(
      p => typeof p === "number" && p > 0
    );

    const mainPrice = validPrices.length
      ? Math.min(...validPrices)
      : 0;

    // ✅ Total stock
    const totalStock = normalizedVariants.reduce(
      (total, variant) => {
        return total + variant.sizes.reduce(
          (sum, size) => sum + size.stock,
          0
        );
      },
      0
    );

    // ✅ Thumbnail fallback
    const thumbnail =
      normalizedVariants[0]?.images?.[0] || "";

    const product = await Product.create({
      title: title.trim(),
      slug,
      description,
      category,

      price: mainPrice,
      compareAtPrice: compareAtPrice
        ? Number(compareAtPrice)
        : undefined,

      tags,
      variants: normalizedVariants,
      thumbnail,
      sku,

      stock: totalStock,
      featured: Boolean(featured),

      // ✅ NEW FIELDS
      specifications,
      isCustomizable: Boolean(isCustomizable),
      customizationOptions
    });

    res.status(201).json(product);

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

//Update Product

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.title) {
      data.slug = await generateUniqueSlug(data.title);
    }

    // ✅ Handle variants update properly
    if (data.variants && data.variants.length > 0) {

      const normalizedVariants = data.variants.map((v) => ({
        baseColorName: v.baseColorName || "",
        colorName: v.colorName || "",
        colorCode: v.colorCode || "#000000",

        images: v.images || [],

        engravingColorType:
          v.engravingColorType || "light",

        sizes: (v.sizes || []).map((s) => ({
          capacity: s.capacity || "",

          price: Number(s.price) || 0,

          compareAtPrice: s.compareAtPrice
            ? Number(s.compareAtPrice)
            : undefined,

          stock: Number(s.stock) || 0
        }))
      }));

      // ✅ Use MIN price (important for sorting/filtering)
      const allPrices = normalizedVariants.flatMap(v =>
        v.sizes.map(s => s.price)
      );

      const validPrices = allPrices.filter(
        p => typeof p === "number" && p > 0
      );

      const mainPrice = validPrices.length
        ? Math.min(...validPrices)
        : 0;

      // ✅ Total stock
      const totalStock = normalizedVariants.reduce(
        (total, variant) => {
          return total + variant.sizes.reduce(
            (sum, size) => sum + size.stock,
            0
          );
        },
        0
      );

      // ✅ Thumbnail update
      data.thumbnail = normalizedVariants[0]?.images?.[0] || "";

      data.variants = normalizedVariants;
    }

    // ✅ Ensure proper types
    if (data.compareAtPrice) {
      data.compareAtPrice = Number(data.compareAtPrice);
    }

    if (data.isCustomizable !== undefined) {
      data.isCustomizable = Boolean(data.isCustomizable);
    }

    data.updatedAt = Date.now();

    const updated = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true // 🔥 important
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updated);

  } catch (err) {
    return res.status(400).json({ message: err.message });
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
