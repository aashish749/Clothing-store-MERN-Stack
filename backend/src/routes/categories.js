import { protect, admin } from "../middleware/auth.js";
import categories from "../models/category.js";
import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
} from "../controllers/categoryController.js";

const router = express.Router();

router.post("/create", protect, admin, createCategory);
router.put("/update/:id", protect, admin, updateCategory);
router.delete("/delete/:id", protect, admin, deleteCategory);
router.get("/list", getCategories);
router.get("/detail/:id", getCategoryById);

export default router;
