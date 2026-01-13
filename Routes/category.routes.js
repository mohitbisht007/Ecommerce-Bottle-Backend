import express from "express";
import { 
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory 
} from "../Controllers/category.controller.js";

import { authenticateUser, authorizeAdmin } from "../Middlewares/authenticateUser.js";

const router = express.Router();

// Public route for Homepage
router.get("/categories", getCategories);

// Admin routes (You can add your verifyAdmin middleware here)
router.post("/categories/add", authenticateUser, authorizeAdmin, createCategory);
router.delete("/categories/:id", authenticateUser, authorizeAdmin, deleteCategory);
router.put("/categories/:id", authenticateUser, authorizeAdmin, updateCategory);

export default router;