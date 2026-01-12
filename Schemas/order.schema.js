import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [mongoose.Schema.Types.Mixed], // Use Mixed for now to prevent validation crashes during testing
  shippingAddress: {
    name: String,
    number: String,
    street: String,
    city: String,
    zip: String,
    state: String
  },
  totalAmount: { type: Number, required: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String }, // Add this to store the successful payment ID
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);