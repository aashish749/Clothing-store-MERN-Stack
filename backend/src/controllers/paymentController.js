import Stripe from "stripe";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { sendPaymentSuccessEmail } from "../utils/emailTriggers.js";

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const markOrderAndPaymentSuccess = async (
  orderId,
  paymentIntentId,
  payload = {},
) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  const wasAlreadyPaid = order.isPaid;

  order.isPaid = true;
  order.paidAt = new Date();
  if (
    order.orderStatus === "Pending" ||
    order.orderStatus === "PaymentFailed"
  ) {
    order.orderStatus = "Confirmed";
  }
  await order.save();

  if (!wasAlreadyPaid) {
    await sendPaymentSuccessEmail(order, "Stripe");
  }

  await Payment.findOneAndUpdate(
    { orderId, transactionId: paymentIntentId },
    {
      orderId,
      userId: order.userId,
      transactionId: paymentIntentId,
      method: "STRIPE",
      status: "succeeded",
      amount: order.totalPrice,
      currency: String(
        payload.currency || process.env.STRIPE_CURRENCY || "usd",
      ),
      rawPayload: payload,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const markOrderAndPaymentFailure = async (
  orderId,
  paymentIntentId,
  status = "failed",
  payload = {},
) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  if (!order.isPaid) {
    order.orderStatus = "PaymentFailed";
    await order.save();
  }

  await Payment.findOneAndUpdate(
    { orderId, transactionId: paymentIntentId },
    {
      orderId,
      userId: order.userId,
      transactionId: paymentIntentId,
      method: "STRIPE",
      status,
      amount: order.totalPrice,
      currency: String(
        payload.currency || process.env.STRIPE_CURRENCY || "usd",
      ),
      rawPayload: payload,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

// @desc    Create Stripe payment intent for an order
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const isOwner = order.userId.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (order.paymentMethod !== "STRIPE") {
      return res.status(400).json({
        success: false,
        message: "Order paymentMethod must be STRIPE for card payment",
      });
    }

    if (order.isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid" });
    }

    const stripe = getStripeClient();
    const currency = String(process.env.STRIPE_CURRENCY || "usd").toLowerCase();

    // Stripe expects amount in smallest currency unit (e.g., cents for USD).
    const amount = Math.round(Number(order.totalPrice) * 100);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
      },
    });

    await Payment.findOneAndUpdate(
      { orderId: order._id, transactionId: intent.id },
      {
        orderId: order._id,
        userId: order.userId,
        transactionId: intent.id,
        method: "STRIPE",
        status: "created",
        amount: order.totalPrice,
        currency,
        rawPayload: {
          paymentIntentId: intent.id,
          status: intent.status,
          clientSecret: intent.client_secret,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      success: true,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      amount: order.totalPrice,
      currency,
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Confirm Stripe payment intent
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ success: false, message: "paymentIntentId is required" });
    }

    const stripe = getStripeClient();

    let intent;
    if (paymentMethodId) {
      intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } else {
      intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    const orderId = intent.metadata?.orderId;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "payment intent is missing order metadata",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const isOwner = order.userId.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (intent.status === "succeeded") {
      await markOrderAndPaymentSuccess(orderId, paymentIntentId, intent);
    } else if (
      intent.status === "requires_payment_method" ||
      intent.status === "canceled"
    ) {
      const failedStatus = intent.status === "canceled" ? "canceled" : "failed";
      await markOrderAndPaymentFailure(
        orderId,
        paymentIntentId,
        failedStatus,
        intent,
      );
    } else {
      await Payment.findOneAndUpdate(
        { orderId, transactionId: paymentIntentId },
        {
          status: "processing",
          rawPayload: intent,
        },
        { upsert: false },
      );
    }

    return res.status(200).json({
      success: true,
      paymentIntentId: intent.id,
      status: intent.status,
    });
  } catch (err) {
    console.error("confirmPayment error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Stripe webhook callback
// @route   POST /api/payments/webhook
// @access  Public (signature verified)
export const stripeWebhook = async (req, res) => {
  try {
    let event;
    const stripe = getStripeClient();

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } else {
      // Fallback for local testing without webhook signature setup.
      const body = Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString("utf8"))
        : req.body;
      event = body;
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      await markOrderAndPaymentSuccess(
        intent.metadata?.orderId,
        intent.id,
        intent,
      );
    }

    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const intent = event.data.object;
      const failedStatus =
        event.type === "payment_intent.canceled" ? "canceled" : "failed";
      await markOrderAndPaymentFailure(
        intent.metadata?.orderId,
        intent.id,
        failedStatus,
        intent,
      );
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripeWebhook error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};
