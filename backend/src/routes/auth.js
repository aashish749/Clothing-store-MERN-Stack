import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginUser);

// @route   admin authorized route .
router.post("/admin-login", protect, admin, (req, res) => {
  res.json({ success: true, message: "Welcome, Admin!" });
});

export default router;
