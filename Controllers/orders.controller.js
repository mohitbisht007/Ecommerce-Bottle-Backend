import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../Schemas/order.schema.js";
import dotenv from "dotenv"

dotenv.config()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Order
export const createOrder = async (req, res) => {
    try {
        const { items, address } = req.body;
        console.log(req.user)
        console.log("🔥 CHECKOUT HIT 🔥");

        console.log("ITEMS:", items);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized: user missing" });
        }

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.price * item.quantity;
        }

        console.log("✅ TOTAL AMOUNT (RUPEES):", totalAmount);


        const options = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const rzpOrder = await razorpay.orders.create(options);

        console.log("🧾 RAZORPAY ORDER AMOUNT (PAISE):", rzpOrder.amount);

        const newOrder = await Order.create({
            user: req.user.id,
            items,
            shippingAddress: address,
            totalAmount,
            razorpayOrderId: rzpOrder.id,
            paymentStatus: "Pending"
        });

        console.log("ORDER SAVED:", newOrder._id);

        res.status(200).json({
            success: true,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount
        });

    } catch (err) {
        // THIS IS THE MOST IMPORTANT PART FOR YOU RIGHT NOW
        console.error("CRITICAL DB/RAZORPAY ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Step 2: Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    console.log("🔥 VERIFY PAYMENT HIT 🔥", req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    console.log("ORDER FOUND:", order?._id);

    if (!order) {
      return res.status(404).json({ error: "Order not found for this Razorpay order ID" });
    }

    order.paymentStatus = "Paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    console.log("ORDER UPDATED TO PAID:", order._id);

    return res.status(200).json({ success: true, message: "Payment verified" });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

// --- FOR CUSTOMERS: View only their own orders ---
export const getMyOrders = async (req, res) => {
    try {
        // Find orders where user ID matches the logged-in user
        // .sort({ createdAt: -1 }) ensures newest orders appear first
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
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
            .populate('user', 'name email') 
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalOrders: orders.length,
            orders
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
