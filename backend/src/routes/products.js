import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProducts,
  uploadProductImages,
} from "../controllers/productController.js";
import { admin, protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

const handleProductImageUpload = (req, res, next) => {
  upload.array("images", 6)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Invalid image upload request",
      });
    }
    return next();
  });
};

router.post("/create", protect, admin, handleProductImageUpload, createProduct);
router.post(
  "/upload-images",
  protect,
  admin,
  handleProductImageUpload,
  uploadProductImages,
);
router.put(
  "/update/:id",
  protect,
  admin,
  handleProductImageUpload,
  updateProduct,
);
router.delete("/delete/:id", protect, admin, deleteProduct);
router.get("/list", getProducts);
router.get("/detail/:id", getProductById);

export default router;
