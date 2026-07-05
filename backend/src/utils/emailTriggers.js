import User from "../models/User.js";
import Order from "../models/Order.js";
import { sendEmail } from "./emailService.js";
import {
  newsletterSignupTemplate,
  orderConfirmationTemplate,
  paymentSuccessTemplate,
  registrationEmailTemplate,
  shipmentEmailTemplate,
} from "./emailTemplates.js";

const safeSend = async (payload) => {
  try {
    await sendEmail(payload);
  } catch (error) {
    console.error("Email send failed:", error.message);
  }
};

export const sendRegistrationEmail = async (user) => {
  if (!user?.email) return;
  const template = registrationEmailTemplate({ name: user.name });
  await safeSend({ to: user.email, ...template });
};

export const sendNewsletterSignupEmail = async (user, emailOverride = "") => {
  const email = emailOverride || user?.email;
  if (!email) return;
  const template = newsletterSignupTemplate({ name: user?.name, email });
  await safeSend({ to: email, ...template });
};

export const sendOrderConfirmationEmail = async (order) => {
  if (!order) return;

  const user = await User.findById(order.userId).select("name email");
  if (!user?.email) return;

  const items = (order.items || []).map((item) => ({
    name: item.productId?.name || "Product",
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));

  const template = orderConfirmationTemplate({
    name: user.name,
    orderId: order._id.toString(),
    items,
    totalPrice: order.totalPrice,
    shippingAddress: order.shippingAddress,
  });

  await safeSend({ to: user.email, ...template });
};

export const sendPaymentSuccessEmail = async (
  order,
  paymentMethod = "Stripe",
) => {
  if (!order) return;

  const user = await User.findById(order.userId).select("name email");
  if (!user?.email) return;

  const template = paymentSuccessTemplate({
    name: user.name,
    orderId: order._id.toString(),
    amount: order.totalPrice,
    currency: process.env.STRIPE_CURRENCY || "EUR",
    paymentMethod,
  });

  await safeSend({ to: user.email, ...template });
};

export const sendShipmentEmail = async (order, status = "Shipped") => {
  if (!order) return;

  const user = await User.findById(order.userId).select("name email");
  if (!user?.email) return;

  const template = shipmentEmailTemplate({
    name: user.name,
    orderId: order._id.toString(),
    status,
  });

  await safeSend({ to: user.email, ...template });
};
