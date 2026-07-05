import express from "express";
import {
  createOrder,
  getAllOrdersAdmin,
  getMyOrders,
  getOrderById,
  updateOrderStatusAdmin,
} from "../controllers/orderController.js";
import { admin, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);

router.get("/admin/all", protect, admin, getAllOrdersAdmin);
router.put("/admin/:id/status", protect, admin, updateOrderStatusAdmin);

router.get("/:id", protect, getOrderById);

export default router;
