import express from "express";
import { getRevenueAnalytics } from "../controllers/revenueAnalyticsController.js";
import { getUserAnalytics } from "../controllers/userAnalyticsController.js";
import { getInventoryAnalytics } from "../controllers/inventoryAnalyticsController.js";
import { admin, protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/revenue", protect, admin, getRevenueAnalytics);
router.get("/users", protect, admin, getUserAnalytics);
router.get("/inventory", protect, admin, getInventoryAnalytics);

export default router;
