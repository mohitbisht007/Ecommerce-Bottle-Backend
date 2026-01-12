import express from "express";
import { getBanners, addBanner, deleteBanner, getSettings, updateSettings } from "../Controllers/storefront.controller.js";
import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";
// Add this to your existing storefront routes

const router = express.Router();

// Public Route (Used by your Homepage)
router.get("/storefront/banners", getBanners);

// Admin Routes (Used by your Storefront Management page)
router.post("/storefront/banners", authenticateUser, authorizeAdmin, addBanner);
router.delete("/storefront/banners/:id", authenticateUser, authorizeAdmin, deleteBanner);
router.get("/storefront/settings", getSettings);
router.patch("/storefront/settings", authenticateUser, authorizeAdmin, updateSettings);

export default router;