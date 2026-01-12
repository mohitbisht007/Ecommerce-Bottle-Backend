import express from "express";
import { createOrder, verifyPayment, getMyOrders, getAllOrdersAdmin, updateOrderStatus } from "../Controllers/orders.controller.js";
import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";

const router = express.Router();

/** * 1. Initiate Order 
 * Path: POST /api/orders/checkout 
 */
router.post("/checkout", authenticateUser, createOrder);
router.get("/my-orders", authenticateUser, getMyOrders);

/** * 2. Verify Payment (Signature check)
 * Path: POST /api/orders/verify 
 */
router.post("/verify", authenticateUser, verifyPayment);


// ADmin
router.get("/admin/all", authenticateUser, authorizeAdmin, getAllOrdersAdmin);
router.put("/admin/update/:orderId", authenticateUser, authorizeAdmin, updateOrderStatus);

export default router;