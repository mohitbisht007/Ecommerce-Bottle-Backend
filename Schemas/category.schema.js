import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // The slug/id (e.g., "steel-bottles")
  displayName: { type: String, required: true },       // The pretty name (e.g., "Steel Bottles")
  image: { type: String, required: true },             // Lifestyle image URL
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);