import express from "express";
import { createOrder, verifyPayment, getMyOrders, getAllOrdersAdmin, updateOrderStatus, getOrderInvoice, getOrderDetails } from "../Controllers/orders.controller.js";
import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";

const router = express.Router();

/** Standard Razorpay aliases (also available at /api/create-order and /api/verify-payment) */
router.post("/checkout", createOrder);
router.post("/verify", verifyPayment);
router.get("/invoice/:orderId", authenticateUser, getOrderInvoice); // Matches: fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/invoice/${order._id}`)

router.get("/my-orders", authenticateUser, getMyOrders);

router.get("/:orderId", authenticateUser, getOrderDetails); // Matches: fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`)

// ADmin
router.get("/admin/all", authenticateUser, authorizeAdmin, getAllOrdersAdmin);
router.put("/admin/update/:orderId", authenticateUser, authorizeAdmin, updateOrderStatus);

export default router;