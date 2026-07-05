import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers_Admin,
  deleteUser_Admin,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/profile/update", protect, updateUserProfile);
router.get("/admin/users", protect, getAllUsers_Admin);
router.delete("/admin/:id", protect, deleteUser_Admin);
router.get("/addresses", protect, getUserAddresses);
router.post("/addresses", protect, addUserAddress);
router.put("/addresses/:addressId", protect, updateUserAddress);
router.delete("/addresses/:addressId", protect, deleteUserAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);
export default router;
