import Reveiws from "../Schemas/reveiwsSchema.js";
import Product from "../Schemas/product.schema.js";

export const listReviews = async (req, res) => {
  try {
    const { productId, limit = 20, page = 1 } = req.query;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Review.find({ product: productId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Review.countDocuments({ product: productId })
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    return res.status(400).json(err.message)
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId, rating = 5, comment = '', name } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId required' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'rating must be 1-5' });

    // Ensure product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = await Review.create({
      product: productId,
      user: req.user ? req.user._id : undefined,
      name: name || (req.user && req.user.name) || 'Anonymous',
      rating: Number(rating),
      comment: String(comment).trim()
    });

    // Optionally update product aggregated rating/reviewsCount
    try {
      const stats = await Review.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      if (stats && stats[0]) {
        product.rating = Math.round(stats[0].avgRating * 10) / 10;
        product.reviewsCount = stats[0].count;
        await product.save();
      }
    } catch (e) {
      console.warn('Could not update product review stats', e.message);
    }

    res.status(201).json(review);
  } catch (err) {
    return res.status(400).json(err.message)
  }
};