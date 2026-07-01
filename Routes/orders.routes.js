import express from "express";
import { createOrder, verifyPayment, getMyOrders, getAllOrdersAdmin, updateOrderStatus, getOrderInvoice, getOrderDetails } from "../Controllers/orders.controller.js";
import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";

const router = express.Router();

/** * 1. Initiate Order 
 * Path: POST /api/orders/checkout 
 */
router.post("/checkout", createOrder);
router.get("/my-orders", authenticateUser, getMyOrders);
router.get("/:orderId", authenticateUser, getOrderDetails); // Matches: fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`)
router.get("/invoice/:orderId", authenticateUser, getOrderInvoice); // Matches: fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/invoice/${order._id}`)

/** * 2. Verify Payment (Signature check)
 * Path: POST /api/orders/verify 
 */
router.post("/verify", verifyPayment);


// ADmin
router.get("/admin/all", authenticateUser, authorizeAdmin, getAllOrdersAdmin);
router.put("/admin/update/:orderId", authenticateUser, authorizeAdmin, updateOrderStatus);

export default router;