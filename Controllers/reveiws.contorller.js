import Reviews from "../Schemas/reveiwsSchema.js";
import Product from "../Schemas/product.schema.js";

export const addReview = async (req, res) => {
  try {
    // 1. ADD 'images' to the destructuring here
    const { productId, rating, comment, name, images } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: "Product ID and Rating are required" });
    }

    // 2. Create the review WITH the images array
    const review = await Reviews.create({
      product: productId,
      name: name || "Anonymous Customer",
      rating: Number(rating),
      comment: comment || "",
      images: images || [], // Save the array of Cloudinary URLs
      user: req.user ? req.user._id : null 
    });

    // 3. Recalculate Product Rating & Review Count
    const allReviews = await Reviews.find({ product: productId });
    const reviewsCount = allReviews.length;
    const avgRating = allReviews.reduce((acc, item) => item.rating + acc, 0) / reviewsCount;

    // 4. Update the Product Document
    await Product.findByIdAndUpdate(productId, {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: reviewsCount
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Add Review Error:", err);
    res.status(400).json({ message: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Reviews.find({ product: productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};