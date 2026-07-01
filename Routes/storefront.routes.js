import express from "express";
import { 
  getBanners, addBanner, deleteBanner, 
  getSettings, updateSettings, 
  addReel, getActiveReelsStream, getAdminProductsList, deleteReel // Added missing imports
} from "../Controllers/storefront.controller.js";
import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";

const router = express.Router();

// Public Routes (Used by your Storefront/Homepage)
router.get("/storefront/banners", getBanners);
router.get("/storefront/stream", getActiveReelsStream); // Matches frontend fetch stream
router.get("/storefront/settings", getSettings);

// Admin Routes (Used by your Storefront Management Dashboard page)
router.post("/storefront/banners", authenticateUser, authorizeAdmin, addBanner);
router.delete("/storefront/banners/:id", authenticateUser, authorizeAdmin, deleteBanner);
router.patch("/storefront/settings", authenticateUser, authorizeAdmin, updateSettings);

// Watch & Buy Admin Routes
router.get("/storefront/admin/products", authenticateUser, authorizeAdmin, getAdminProductsList); // Dropdown fetch
router.post("/storefront/addReel", authenticateUser, authorizeAdmin, addReel); // Add reel
router.delete("/storefront/reels/:id", authenticateUser, authorizeAdmin, deleteReel); // Delete reel

export default router;