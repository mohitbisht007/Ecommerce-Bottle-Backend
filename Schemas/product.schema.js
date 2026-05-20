import mongoose from "mongoose";
const variantSchema = new mongoose.Schema({
  baseColorName: String,
  colorName: String, // e.g., "Ocean Blue"
  colorCode: String, // e.g., "#0000FF"
  engravingColorType: { 
    type: String, 
    enum: ['light', 'dark'], 
    default: 'light' // 'light' means white font (for dark bottles)
  },

  sizes: [{
    capacity: { type: String, required: true }, // e.g., "500ml"
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    stock: { type: Number, default: 0 }
  }],
  images: [String],
  
});

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
    required: false
  },

  category: {
    type: String,
    trim: true,
    default: '',
  },

  specifications: {
    // 1. Basic Specifications
    type: { type: String }, // Bottle / Mug
    material: { type: String },
    weight: { type: String },
    dimensions: { type: String },
    finish: { type: String },
    origin: { type: String },

    // 2. Performance Specs
    insulation: { type: String },
    hotRetention: { type: String },
    coldRetention: { type: String },
    leakproof: { type: Boolean },
    condensationFree: { type: Boolean },
    rustProof: { type: Boolean },

    // 3. Usage & Convenience
    suitableFor: { type: [String] },
    mouthType: { type: String },
    lidType: { type: String },
    dishwasherSafe: { type: Boolean },
    carHolderFit: { type: Boolean }
  },

  sku: {
    type: String,
    trim: true
  },

  tags: {
    type: [String],
    default: []
  },

  variants: [variantSchema],
  thumbnail: String,

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

  isCustomizable: {
    type: Boolean,
    default: false
  },

  customizationOptions: {
    price: { 
      type: Number, 
      default: 299 
    },
    maxChars: { 
      type: Number, 
      default: 12 
    },
    allowedFonts: {
      type: [String],
      default: ["Modern", "Elegant", "Sport", "Classic"]
    },
    // Allows you to adjust the text position per product if needed
    textPosition: {
      top: { type: String, default: "55%" },
      left: { type: String, default: "50%" }
    },
    
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
