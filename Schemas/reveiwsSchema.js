import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
  name: { type: String }, // display name if anonymous or user name fallback
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Reveiws = mongoose.model("Reveiws", reviewSchema)
export default Reveiws