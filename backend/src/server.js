import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import categoryRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import shippingRoutes from "./routes/shipping.js";
import siteSettingsRoutes from "./routes/siteSettings.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import reviewRoutes from "./routes/reviews.js";
import newsletterRoutes from "./routes/newsletter.js";
import contactRoutes from "./routes/contact.js";
import adminAnalyticsRoutes from "./routes/adminAnalytics.js";
import aiRoutes from "./routes/ai.js";
import { stripeWebhook } from "./controllers/paymentController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://forever-store.aashis.dev",
      process.env.FRONTEND_URL,
    ],
    secure: true,
    credentials: true,
  }),
);

// Stripe webhook must use raw body to validate signatures.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json());
app.use(morgan("dev"));

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/ai", aiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export the app for Vercel serverless runtime
export default app;

// Start server locally only
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}
