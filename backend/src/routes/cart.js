import express from "express";
import {
  addToCart,
  clearCart,
  getCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/items/:itemId", protect, updateCartItem);
router.delete("/items/:itemId", protect, removeCartItem);
router.post("/clear", protect, clearCart);
router.post("/merge", protect, mergeGuestCart);

export default router;
