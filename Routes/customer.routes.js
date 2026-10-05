import express from "express";

import {
  getAllCustomersAdmin,
  getCustomerByIdAdmin,
  updateCustomerAdmin,
} from "../Controllers/customer.controller.js";

import {
  authenticateUser,
  authorizeAdmin,
} from "../Middlewares/authenticateUser.js";

const router = express.Router();

/*
 * Get all customers
 * Supports:
 * GET /api/customers/admin
 * GET /api/customers/admin?search=mohit
 */
router.get(
  "/admin",
  authenticateUser,
  authorizeAdmin,
  getAllCustomersAdmin
);

/*
 * Get complete customer details
 * Includes:
 * - Personal information
 * - Addresses (view only)
 * - Wishlist
 * - Orders
 * - Order summary
 */
router.get(
  "/admin/:customerId",
  authenticateUser,
  authorizeAdmin,
  getCustomerByIdAdmin
);

/*
 * Update customer information
 * Admin can update:
 * - Name
 * - Email
 * - Phone
 *
 * Addresses are NOT editable.
 */
router.put(
  "/admin/:customerId",
  authenticateUser,
  authorizeAdmin,
  updateCustomerAdmin
);

export default router;