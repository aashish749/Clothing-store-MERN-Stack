import express from "express";
import {
  addProductReview,
  addAdminReview,
  addAdminReviewsBulk,
  getAllReviewsAdmin,
  deleteReview,
  getProductReviews,
} from "../controllers/reviewController.js";
import { admin, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/products/:id/reviews", protect, addProductReview);
router.get("/products/:id/reviews", getProductReviews);
router.post("/admin", protect, admin, addAdminReview);
router.post("/admin/bulk", protect, admin, addAdminReviewsBulk);
router.get("/admin/all", protect, admin, getAllReviewsAdmin);
router.delete("/:id", protect, deleteReview);

export default router;
