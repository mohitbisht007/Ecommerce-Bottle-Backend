import StockNotification from "../Schemas/stockNotification.schema.js";
import User from "../Schemas/user.schema.js";
import Product from "../Schemas/product.schema.js";

import {
  sendStockNotificationRequest,
} from "../utils/emailService.js";

export const createStockNotification = async (req, res) => {
  try {
    const {
      productId,
      color,
      capacity,
      email,
      phone,
    } = req.body;

    if (!productId || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Product and capacity are required",
      });
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /*
     * Find selected variant
     */
    const variant = product.variants?.find(
      (v) => v.colorName === color
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    /*
     * Find selected capacity
     */
    const selectedSize = variant.sizes?.find(
      (size) => size.capacity === capacity
    );

    if (!selectedSize) {
      return res.status(404).json({
        success: false,
        message: "Product capacity not found",
      });
    }

    /*
     * Product is already in stock
     */
    if (Number(selectedSize.stock || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: "This product is already in stock",
      });
    }

    /*
     * Get logged-in user if available
     */
    let user = null;

    let customerEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    let customerPhone =
      typeof phone === "string"
        ? phone.trim()
        : "";

    if (req.user?.id) {
      user = await User.findById(req.user.id)
        .select("name email phone")
        .lean();

      if (user) {
        customerEmail = user.email;
        customerPhone = user.phone || customerPhone;
      }
    }

    /*
     * Email is required for notification
     */
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    /*
     * Prevent duplicate active requests
     */
    const existingNotification =
      await StockNotification.findOne({
        product: productId,
        color: color || "",
        capacity,
        email: customerEmail,
        notified: false,
      });

    if (existingNotification) {
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        message:
          "You are already registered for this product",
      });
    }

    /*
     * Create stock notification request
     */
    const notification =
      await StockNotification.create({
        product: productId,
        productTitle: product.title,
        color: color || "",
        capacity,
        email: customerEmail,
        phone: customerPhone,
        user: user?._id || null,
      });

    /*
     * Send email to BouncyBucket admin
     */
    try {
      await sendStockNotificationRequest({
        productTitle: product.title,
        color: color || "",
        capacity,
        email: customerEmail,
        phone: customerPhone,
        requestedAt: notification.createdAt,
      });
    } catch (emailError) {
      /*
       * Don't delete the notification if email fails.
       * The customer's request is still safely stored.
       */
      console.error(
        "STOCK NOTIFICATION ADMIN EMAIL ERROR:",
        emailError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "You will be notified when this product is back in stock",
    });
  } catch (error) {
    console.error(
      "CREATE STOCK NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to register stock notification",
    });
  }
};