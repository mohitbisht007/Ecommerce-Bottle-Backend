import mongoose from "mongoose";

const stockNotificationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productTitle: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      default: "",
    },

    capacity: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notified: {
      type: Boolean,
      default: false,
    },

    notifiedAt: {
      type: Date,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const StockNotification = mongoose.model(
  "StockNotification",
  stockNotificationSchema
);

export default StockNotification;