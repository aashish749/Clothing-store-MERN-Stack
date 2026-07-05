import express from "express";
import upload from "../middleware/upload.js";
import { admin, protect } from "../middleware/auth.js";
import {
  getAdminSiteSettings,
  getPublicSiteSettings,
  updateSiteSettings,
  uploadHeroImage,
} from "../controllers/siteSettingsController.js";

const router = express.Router();

router.get("/public", getPublicSiteSettings);
router.get("/admin", protect, admin, getAdminSiteSettings);
router.put("/admin", protect, admin, updateSiteSettings);
router.post(
  "/admin/hero-image",
  protect,
  admin,
  upload.single("image"),
  uploadHeroImage,
);

export default router;
