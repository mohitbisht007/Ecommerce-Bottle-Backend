import express from "express";

import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../Controllers/coupon.controller.js";

import {
  authenticateUser,
  authorizeAdmin,
} from "../Middlewares/authenticateUser.js";

const router = express.Router();

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
// CUSTOMER
// ===============================

router.post(
  "/validate",
  validateCoupon
);

export default router;