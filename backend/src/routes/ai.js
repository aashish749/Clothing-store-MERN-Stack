import express from "express";
import { admin, protect } from "../middleware/auth.js";
import { generateProductDescription } from "../controllers/aiController.js";

const router = express.Router();

router.post("/product-description", protect, admin, generateProductDescription);

export default router;
