import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items: [mongoose.Schema.Types.Mixed],

  shippingAddress: {
    name: String,
    email: String,
    number: String,
    street: String,
    city: String,
    zip: String,
    state: String,
  },

  totalAmount: {
    type: Number,
    required: true,
  },

  // Invoice Details
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true,
  },

  invoiceDate: {
    type: Date,
  },

  invoicePath: {
    type: String,
  },

  // Payment Details
  paymentMethod: {
    type: String,
    default: "Razorpay",
  },

  razorpayOrderId: {
    type: String,
    required: true,
  },

  razorpayPaymentId: {
    type: String,
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },

  // Order Status
  orderStatus: {
    type: String,
    enum: [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ],
    default: "Processing",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", orderSchema);