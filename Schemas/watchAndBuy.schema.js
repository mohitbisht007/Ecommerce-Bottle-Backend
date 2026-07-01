import mongoose from "mongoose";

const watchAndBuySchema = new mongoose.Schema({
  videoUrl: { type: String, required: true }, // Direct link to compressed MP4 file
  thumbnailUrl: { type: String }, // Static fallback poster image
  linkedProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  caption: { type: String, maxLength: 150 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("WatchAndBuy", watchAndBuySchema);