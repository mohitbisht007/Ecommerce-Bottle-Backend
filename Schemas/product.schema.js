import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  description: {
    type: String,
    default: ''
  },

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    trim: true,
    default: '',
  },

  compareAtPrice: {
    type: Number
  },

  sku: {
    type: String,
    trim: true
  },

  tags: {
    type: [String],
    default: []
  },

  images: {
    type: [String],
    default: []
  },

  stock: {
    type: Number,
    default: 0
  },

  featured: {
    type: Boolean,
    default: false
  },

  rating: {
    type: Number,
    default: 0
  },

  reviewsCount: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Enable text search on title & description & tags
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model("Product", productSchema)
export default Product
