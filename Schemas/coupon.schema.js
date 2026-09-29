import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // Coupon code given to the customer
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Admin can describe what the coupon is for
    description: {
      type: String,
      default: "",
    },

    // percentage = 20% off
    // fixed = ₹200 off
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Minimum number of bottles/items required
    minimumItems: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Optional minimum cart amount
    minimumCartValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Useful for percentage coupons
    maximumDiscount: {
      type: Number,
      default: null,
    },

    // How many times the coupon can be used overall
    usageLimit: {
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    // How many times one customer can use it
    perUserLimit: {
      type: Number,
      default: 1,
    },

    // Coupon validity
    startDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    // Admin can turn coupon on/off
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Coupon", couponSchema);