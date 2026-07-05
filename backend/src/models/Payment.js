import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    method: {
      type: String,
      required: true,
      enum: ["COD", "STRIPE"],
      default: "STRIPE",
    },
    status: {
      type: String,
      required: true,
      enum: ["created", "processing", "succeeded", "failed", "canceled"],
      default: "created",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: "usd",
    },
    rawPayload: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
