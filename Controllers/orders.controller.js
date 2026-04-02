import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../Schemas/order.schema.js";
import User from "../Schemas/user.schema.js";
import { sendOrderEmail } from "../utils/emailService.js";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Order
// Replace your Step 1: Create Order with this:
export const createOrder = async (req, res) => {
  try {
    const { items, address, email } = req.body;
    let userId;

    if (req.user && req.user.id) {
      userId = req.user.id;
    } else {
      const cleanEmail = email.toLowerCase().trim();
      let guestUser = await User.findOne({ email: cleanEmail });

      if (!guestUser) {
        guestUser = await User.create({
          name: address.name,
          email: cleanEmail,
          isGuest: true, // This now tells the schema to skip password validation
          authProvider: "local",
          addresses: [{
            ...address,
            email: cleanEmail // addressSchema requires 'email'
          }]
        });
      }
      userId = guestUser._id;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // RAZORPAY SAFETY CHECK: If this crashes, it's usually because keys are missing in .env
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("CRITICAL: Razorpay Keys are missing in .env file");
      return res.status(500).json({ error: "Payment gateway configuration missing" });
    }

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);

    const newOrder = await Order.create({
      user: userId,
      items,
      shippingAddress: address,
      totalAmount,
      razorpayOrderId: rzpOrder.id,
      paymentStatus: "Pending",
    });

    res.status(200).json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      internalOrderId: newOrder._id,
    });
  } catch (err) {
    console.error("CHECKOUT ERROR LOG:", err); // THIS WILL SHOW IN YOUR TERMINAL
    res.status(500).json({ error: err.message });
  }
};

// Step 2: Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    // 1. Signature Check
    if (razorpay_signature !== expectedSign) {
      // Logic: If signature is wrong, we could technically trigger a "failure" email here 
      // but usually, it's better to just return an error to the frontend.
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // 2. Find Order and Populate User (needed for email address)
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).populate("user");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // 3. Update Status
    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // 4. Trigger Email (Passing "success" as the status)
    try {
      // Your function expects: (email, order, status)
      await sendOrderEmail(order.user.email, order, "success");
    } catch (emailErr) {
      console.error("Payment succeeded but email failed:", emailErr);
    }

    return res.status(200).json({ success: true, message: "Payment verified" });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    // Optional: If you have the order details here, you could trigger the "failure" email template
    return res.status(500).json({ error: error.message });
  }
};

// --- FOR CUSTOMERS: View only their own orders ---
export const getMyOrders = async (req, res) => {
  try {
    // Find orders where user ID matches the logged-in user
    // .sort({ createdAt: -1 }) ensures newest orders appear first
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FOR ADMINS: View every order in the system ---
export const getAllOrdersAdmin = async (req, res) => {
  try {
    // Admins see everything.
    // We use .populate('user', 'name email') to see who placed the order
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FOR ADMINS: Update Order Status (e.g., Pending to Shipped) ---
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // e.g., 'Shipped', 'Delivered'

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
