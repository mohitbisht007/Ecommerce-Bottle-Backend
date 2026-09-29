import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../Schemas/order.schema.js";
import User from "../Schemas/user.schema.js";
import { sendOrderEmail } from "../utils/emailService.js";
import dotenv from "dotenv";
import htmlPdf from "html-pdf-node";
import { generateInvoiceHTML } from "../utils/invoiceTemplate.js";
import { createTestShiprocketShipment } from "../utils/shiprocket.js";
import Coupon from "../Schemas/coupon.schema.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Order
// Replace your Step 1: Create Order with this:
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      address,
      email,
      couponCode,
    } = req.body;

    let userId;

    // -----------------------------
    // 1. IDENTIFY USER
    // -----------------------------
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else {
      const cleanEmail = email.toLowerCase().trim();

      let guestUser = await User.findOne({
        email: cleanEmail,
      });

      if (!guestUser) {
        guestUser = await User.create({
          name: address.name,
          email: cleanEmail,
          isGuest: true,
          authProvider: "local",
          addresses: [
            {
              ...address,
              email: cleanEmail,
            },
          ],
        });
      }

      userId = guestUser._id;
    }

    // -----------------------------
    // 2. CALCULATE CART TOTAL
    // -----------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Cart is empty",
      });
    }

    const cartTotal = items.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );

    if (cartTotal <= 0) {
      return res.status(400).json({
        error: "Invalid cart total",
      });
    }

    // -----------------------------
    // 3. VALIDATE COUPON SERVER-SIDE
    // -----------------------------
    let appliedCoupon = null;
    let couponDiscount = 0;

    if (couponCode) {
      const normalizedCode = couponCode
        .trim()
        .toUpperCase();

      const coupon = await Coupon.findOne({
        code: normalizedCode,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({
          error: "Invalid or inactive coupon",
        });
      }

      // Start date
      if (
        coupon.startDate &&
        new Date() < coupon.startDate
      ) {
        return res.status(400).json({
          error: "This coupon is not active yet",
        });
      }

      // Expiry
      if (
        coupon.expiryDate &&
        new Date() > coupon.expiryDate
      ) {
        return res.status(400).json({
          error: "This coupon has expired",
        });
      }

      // Usage limit
      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          error: "This coupon has reached its usage limit",
        });
      }

      // Total quantity
      const totalItems = items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      // Minimum items
      if (
        totalItems < coupon.minimumItems
      ) {
        return res.status(400).json({
          error: `Add at least ${coupon.minimumItems} bottles to use this coupon`,
        });
      }

      // Minimum cart value
      if (
        cartTotal < coupon.minimumCartValue
      ) {
        return res.status(400).json({
          error: `Minimum cart value of ₹${coupon.minimumCartValue} required`,
        });
      }

      // -----------------------------
      // CALCULATE DISCOUNT
      // -----------------------------
      if (coupon.discountType === "percentage") {
        couponDiscount =
          (cartTotal * coupon.discountValue) /
          100;

        if (
          coupon.maximumDiscount !== null &&
          couponDiscount >
            coupon.maximumDiscount
        ) {
          couponDiscount =
            coupon.maximumDiscount;
        }
      }

      if (coupon.discountType === "fixed") {
        couponDiscount =
          coupon.discountValue;
      }

      // Never discount more than cart
      couponDiscount = Math.min(
        couponDiscount,
        cartTotal
      );

      appliedCoupon = coupon;
    }

    // -----------------------------
    // 4. FINAL PAYABLE AMOUNT
    // -----------------------------
    const finalAmount =
      cartTotal - couponDiscount;

    const amountInPaise =
      Math.round(finalAmount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        error:
          "Minimum order amount is ₹1 (100 paise)",
      });
    }

    // -----------------------------
    // 5. RAZORPAY CONFIG CHECK
    // -----------------------------
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error(
        "CRITICAL: Razorpay Keys are missing in .env file"
      );

      return res.status(500).json({
        error:
          "Payment gateway configuration missing",
      });
    }

    // -----------------------------
    // 6. CREATE RAZORPAY ORDER
    // -----------------------------
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    let rzpOrder;

    try {
      rzpOrder =
        await razorpay.orders.create(options);
    } catch (rzpErr) {
      console.error(
        "RAZORPAY API ERROR:",
        rzpErr
      );

      if (rzpErr.statusCode === 401) {
        return res.status(401).json({
          error:
            "Razorpay authentication failed. Check API keys.",
        });
      }

      return res.status(500).json({
        error:
          rzpErr.error?.description ||
          "Failed to create Razorpay order",
      });
    }

    // -----------------------------
    // 7. SAVE ORDER
    // -----------------------------
    const newOrder = await Order.create({
      user: userId,
      items,
      shippingAddress: address,

      // IMPORTANT:
      // This is now the discounted amount.
      totalAmount: finalAmount,

      razorpayOrderId: rzpOrder.id,

      paymentStatus: "Pending",

      coupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            discount: couponDiscount,
          }
        : undefined,
    });

    // -----------------------------
    // 8. SEND RESPONSE
    // -----------------------------
    return res.status(200).json({
      success: true,

      order_id: rzpOrder.id,
      orderId: rzpOrder.id,

      amount: rzpOrder.amount,
      currency: rzpOrder.currency,

      internalOrderId: newOrder._id,

      // Useful for frontend confirmation/debugging
      originalAmount: cartTotal,
      discount: couponDiscount,
      finalAmount,
      coupon: appliedCoupon
        ? appliedCoupon.code
        : null,
    });

  } catch (err) {
    console.error(
      "CHECKOUT ERROR LOG:",
      err
    );

    return res.status(500).json({
      error: err.message,
    });
  }
};

// Step 2: Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Payment gateway configuration missing" });
    }

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

    if (process.env.SHIPROCKET_TEST_MODE === "true") {
      try {
        const testShipment = await createTestShiprocketShipment(order);

        order.shiprocket = testShipment;

        console.log("TEST SHIPROCKET SHIPMENT CREATED:", testShipment);
      } catch (shiprocketError) {
        console.error(
          "TEST SHIPROCKET ERROR:",
          shiprocketError.message
        );
      }
    }

    await order.save();

    // 4. Trigger Email (Passing "success" as the status)
    console.log("========== EMAIL DEBUG ==========");
    console.log("User:", order.user);
    console.log("Email:", order.user?.email);

    try {
      await sendOrderEmail(order.user.email, order, "success");
    } catch (err) {
      console.error("Email Error:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified",
    });

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


export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order record not found" });
    }

    // Security Verification: Ensure the customer logged in owns this order record
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied: Unauthorized view request" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FOR CUSTOMERS: Stream and download the tax invoice PDF ---
export const getOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order record not found" });
    }

    // Security Verification: Ensure the customer logged in owns this order to download invoice
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied: Unauthorized download request" });
    }

    // Compile the fresh corporate layout
    const htmlContent = generateInvoiceHTML(order);

    const fileOptions = { format: "A4" };
    const fileSource = { content: htmlContent };

    // Convert HTML directly to an in-memory PDF buffer stream
    const pdfBuffer = await htmlPdf.generatePdf(fileSource, fileOptions);

    const cleanId = (order.razorpayOrderId || order._id).replace(/^order_/, "").toUpperCase();

    // Set binary layout headers to prompt a clean file download on the browser
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Invoice_BB-${cleanId}.pdf`,
      "Content-Length": pdfBuffer.length
    });

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("INVOICE GENERATION BACKEND ERROR:", error);
    res.status(500).json({ success: false, message: "Could not compile tax document layout streams." });
  }
};


export const testShiprocketShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const testShipment = await createTestShiprocketShipment(order);

    order.shiprocket = testShipment;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Test Shiprocket shipment added to order",
      order,
    });
  } catch (error) {
    console.error("TEST SHIPROCKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};