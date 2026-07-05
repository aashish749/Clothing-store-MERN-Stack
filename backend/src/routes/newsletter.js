import express from "express";
import { sendNewsletterSignupEmail } from "../utils/emailTriggers.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name = "", email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    await sendNewsletterSignupEmail({ name, email }, email);

    return res.status(200).json({
      success: true,
      message: "Newsletter signup email sent",
    });
  } catch (error) {
    console.error("newsletter signup error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
