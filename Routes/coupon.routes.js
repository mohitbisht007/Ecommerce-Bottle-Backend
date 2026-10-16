import express from "express";

import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getStorefrontCoupons,
} from "../Controllers/coupon.controller.js";

import {
  authenticateUser,
  authorizeAdmin,
} from "../Middlewares/authenticateUser.js";

const router = express.Router();


// ===============================
// ADMIN
// ===============================

router.post(
  "/admin",
  authenticateUser,
  authorizeAdmin,
  createCoupon
);

router.get(
  "/admin",
  authenticateUser,
  authorizeAdmin,
  getAllCoupons
);

router.put(
  "/admin/:couponId",
  authenticateUser,
  authorizeAdmin,
  updateCoupon
);

router.delete(
  "/admin/:couponId",
  authenticateUser,
  authorizeAdmin,
  deleteCoupon
);


// ===============================
// CUSTOMER / STOREFRONT
// ===============================

// Coupons that admin has chosen to
// display inside the cart/sidebar
router.get(
  "/storefront",
  getStorefrontCoupons
);

// Validate a coupon during checkout/cart
router.post(
  "/validate",
  validateCoupon
);


export default router;