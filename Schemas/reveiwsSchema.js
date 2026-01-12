import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  name: { type: String, required: true }, 
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, default: '' },
  // ADDED: Array of strings for Cloudinary URLs
  images: { type: [String], default: [] }, 
  createdAt: { type: Date, default: Date.now }
});

const Reviews = mongoose.model("Reviews", reviewSchema);
export default Reviews;