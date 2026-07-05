import Cart from "../models/CartModel.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shipping from "../models/ShippingModel.js";
import User from "../models/User.js";
import {
  sendOrderConfirmationEmail,
  sendShipmentEmail,
} from "../utils/emailTriggers.js";
import {
  decrementStockForSelection,
  getAvailableStockForSelection,
  normalizeSelectedOptions,
} from "../utils/variantStock.js";

// Validates that all required shipping address fields are present
// and that each required field is a non-empty string.
const validateAddress = (address) => {
  // If no address object is provided at all, validation fails immediately.
  if (!address) return false;

  // These are the minimum required address keys for checkout.
  const requiredFields = [
    "fullName",
    "phone",
    "line1",
    "city",
    "state",
    "postalCode",
    "country",
  ];

  // every(...) returns true only if every required key passes the condition.
  return requiredFields.every(
    // Each required value must be a string and must not be empty after trim().
    (field) =>
      typeof address[field] === "string" && address[field].trim() !== "",
  );
};

// Normalizes address values before storing snapshot in Order.
// This avoids storing values with accidental leading/trailing spaces.
const sanitizeAddress = (address) => {
  return {
    // Required fields are trimmed to keep data clean and consistent.
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    line1: address.line1.trim(),
    // Optional line2 defaults to empty string if missing.
    line2: (address.line2 || "").trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim(),
  };
};

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    // req.user is set by protect middleware from JWT token.
    const userId = req.user.id;
    // Frontend can send either addressId (saved address) or shippingAddress object.
    // paymentMethod defaults to "COD" if omitted.
    const { shippingAddress, addressId, paymentMethod = "COD" } = req.body;
    const normalizedPaymentMethod = String(
      paymentMethod || "COD",
    ).toUpperCase();

    if (!["COD", "STRIPE"].includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be either COD or STRIPE",
      });
    }

    // Load only addresses because this is the only user data needed here.
    const user = await User.findById(userId).select("addresses");
    if (!user) {
      // User record should exist for valid token, but this guards edge cases.
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // This is the final validated + sanitized shipping address snapshot.
    let finalShippingAddress = null;

    // Flow 1: User chooses a previously saved address.
    if (addressId) {
      // For Mongoose subdocument arrays, .id(...) finds by subdocument _id.
      const selectedAddress = user.addresses.id(addressId);
      if (!selectedAddress) {
        // addressId exists in request but not in this user's saved addresses.
        return res
          .status(404)
          .json({ success: false, message: "Selected address not found" });
      }
      // Save a trimmed snapshot of selected address into order.
      finalShippingAddress = sanitizeAddress(selectedAddress);
      // Flow 2: User sends a fresh shippingAddress object directly in request body.
    } else if (validateAddress(shippingAddress)) {
      // Valid new address is sanitized before storing.
      finalShippingAddress = sanitizeAddress(shippingAddress);
    } else {
      // Neither valid addressId nor valid shippingAddress was provided.
      return res.status(400).json({
        success: false,
        message: "Valid shippingAddress or addressId is required",
      });
    }

    // Checkout always operates on server-side cart for the logged-in user.
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      // Cannot place order without cart items.
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Shipping settings are global (single document). Create defaults if missing.
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // orderItems: the final immutable item snapshot saved to Order.
    const orderItems = [];
    // stockUpdates: queue of stock changes to apply after all validations pass.
    const stockUpdates = [];
    const requestedBySelection = new Map();
    // Running subtotal computed from authoritative DB product prices.
    let subtotal = 0;

    // Validate each cart item one by one.
    for (const cartItem of cart.items) {
      // Re-fetch product from DB to avoid trusting stale frontend/cart data.
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        // Product may have been deleted after user added it to cart.
        return res.status(404).json({
          success: false,
          message: "One or more products in cart no longer exist",
        });
      }

      // Normalize selected variant options so comparisons are reliable.
      const selectedOptions = normalizeSelectedOptions(
        cartItem.selectedOptions || {},
      );

      // Validate option1 only if option1Name is present.
      if (selectedOptions.option1Name) {
        // Find matching variant definition in product.
        const variant1 = product.variants.find(
          (v) => v.name === selectedOptions.option1Name,
        );
        // option value must exist in allowed values list.
        if (
          !variant1 ||
          !variant1.values.includes(selectedOptions.option1Value)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid option1 for product ${product.name}`,
          });
        }
      }

      // Validate option2 only if option2Name is present.
      if (selectedOptions.option2Name) {
        // Find matching variant definition in product.
        const variant2 = product.variants.find(
          (v) => v.name === selectedOptions.option2Name,
        );
        // option value must exist in allowed values list.
        if (
          !variant2 ||
          !variant2.values.includes(selectedOptions.option2Value)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid option2 for product ${product.name}`,
          });
        }
      }

      const selectionKey = [
        product._id.toString(),
        selectedOptions.option1Name,
        selectedOptions.option1Value,
        selectedOptions.option2Name,
        selectedOptions.option2Value,
      ].join("||");

      const availableStock = getAvailableStockForSelection(
        product,
        selectedOptions,
      );
      const reservedQuantity = requestedBySelection.get(selectionKey) || 0;
      const requestedQuantity = reservedQuantity + cartItem.quantity;

      // Hard stock check at checkout time.
      if (requestedQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}`,
        });
      }

      requestedBySelection.set(selectionKey, requestedQuantity);

      // Use current DB price as source of truth to prevent price tampering.
      const priceAtOrder = product.price;
      // lineTotal for this item = unit price * quantity.
      const lineTotal = priceAtOrder * cartItem.quantity;
      // Add to running subtotal.
      subtotal += lineTotal;

      // Push immutable snapshot that will be stored in Order document.
      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        priceAtOrder,
        // markedPrice is optional in Product schema; may be undefined.
        markedPriceAtOrder: product.markedPrice,
        selectedOptions,
        lineTotal,
      });

      // Delay stock write until all items pass validation checks.
      stockUpdates.push({
        product,
        quantity: cartItem.quantity,
        selectedOptions,
      });
    }

    // Apply stock updates only after full validation loop succeeds.
    for (const stockUpdate of stockUpdates) {
      const updated = decrementStockForSelection(
        stockUpdate.product,
        stockUpdate.selectedOptions,
        stockUpdate.quantity,
      );
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${stockUpdate.product.name}`,
        });
      }
      // Persist each updated product document.
      await stockUpdate.product.save();
    }

    // Shipping calculation rules:
    // 1) subtotal 0 => shipping 0
    // 2) if free-shipping threshold is set (> 0) and reached => shipping 0
    // 3) otherwise charge configured shipping fee
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;

    // Final payable amount.
    const totalPrice = subtotal + shippingFee;

    // Create order with full checkout snapshot.
    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      shippingFee,
      totalPrice,
      shippingAddress: finalShippingAddress,
      paymentMethod: normalizedPaymentMethod,
      // Starts as Pending until admin/payment flow updates it.
      orderStatus: "Pending",
      // Default unpaid at order creation.
      isPaid: false,
    });

    // Clear cart after successful order creation.
    cart.items = [];
    await cart.save();

    // Return created order to frontend.
    await order.populate("items.productId", "name");
    await sendOrderConfirmationEmail(order);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    // Helpful server log for debugging unexpected failures.
    console.error("createOrder error:", err);
    // Generic error response for unhandled server-side issues.
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get my orders
// @route   GET /api/orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    // Find orders that belong to current logged-in user.
    const orders = await Order.find({ userId: req.user.id })
      // Newest orders first.
      .sort({ createdAt: -1 })
      // Include basic product details for each item.
      .populate("items.productId", "name images price markedPrice");

    // Return user's order history.
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    // Generic error response for unhandled server-side issues.
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get order by id
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    // Load order by id from route param.
    const order = await Order.findById(req.params.id)
      // Include basic owner data.
      .populate("userId", "name email")
      // Include basic product data for order items.
      .populate("items.productId", "name images price markedPrice");

    if (!order) {
      // Order id does not exist.
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Owner can access; admin can access any order.
    const isOwner = order.userId._id.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin) {
      // Logged-in user is neither owner nor admin.
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Access granted.
    return res.status(200).json({ success: true, order });
  } catch (err) {
    // Generic error response for unhandled server-side issues.
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrdersAdmin = async (req, res) => {
  try {
    // Admin route: return all orders in system.
    const orders = await Order.find()
      // Newest orders first.
      .sort({ createdAt: -1 })
      // Include buyer data.
      .populate("userId", "name email")
      // Include minimal product data.
      .populate("items.productId", "name images");

    // Return all orders.
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    // Generic error response for unhandled server-side issues.
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    // Admin may send one or both fields.
    const { orderStatus, isPaid } = req.body;
    // Load target order by id.
    const order = await Order.findById(req.params.id);
    const previousStatus = order?.orderStatus;

    if (!order) {
      // Order id does not exist.
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Update status only if provided in request body.
    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
    }

    // Update payment flag only if provided in request body.
    if (isPaid !== undefined) {
      // Force boolean conversion for safety.
      order.isPaid = Boolean(isPaid);
      // Set paidAt when marked paid; clear paidAt when marked unpaid.
      order.paidAt = order.isPaid ? new Date() : undefined;
    }

    // Persist updates. Mongoose validates enum/type rules here.
    await order.save();

    if (previousStatus !== "Shipped" && order.orderStatus === "Shipped") {
      await sendShipmentEmail(order, order.orderStatus);
    }

    // Return updated order snapshot.
    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    // Generic error response for unhandled server-side issues.
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
