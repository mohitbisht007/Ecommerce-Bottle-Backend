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
router.get("/", getCategories);

// Admin routes (You can add your verifyAdmin middleware here)
router.post("/add", authenticateUser, authorizeAdmin,createCategory);
router.delete("/:id", authenticateUser, authorizeAdmin, deleteCategory);
router.put("/:id", authenticateUser, authorizeAdmin, updateCategory);

export default router;