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

  coupon: {
    code: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
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
    enum: [
      "Razorpay",
      "Razorpay QR",
      "Cash",
      "Bank Transfer",
      "UPI",
      "Manual"
    ],
    default: "Razorpay"
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

  shiprocket: {
    orderId: {
      type: String,
    },
    shipmentId: {
      type: String,
    },
    awbCode: {
      type: String,
    },
    courierName: {
      type: String,
    },
    status: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    lastUpdatedAt: {
      type: Date,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", orderSchema);