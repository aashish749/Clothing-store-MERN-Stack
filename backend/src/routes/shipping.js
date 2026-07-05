import express from "express";
import {
  getShipping,
  updateShipping,
} from "../controllers/shippingController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// GET shipping settings (public, anyone can see rates)
router.get("/", getShipping);

// PUT update shipping settings (admin only)
router.put("/", protect, admin, updateShipping);

export default router;
