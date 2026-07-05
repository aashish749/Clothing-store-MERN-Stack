import Cart from "../models/CartModel.js";
import Product from "../models/Product.js";
import Shipping from "../models/ShippingModel.js";
import {
  getAvailableStockForSelection,
  normalizeSelectedOptions,
} from "../utils/variantStock.js";

// ==================== GET CART ====================
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Find cart for user
    const cart = await Cart.findOne({ userId });

    // If no cart, return empty cart
    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          userId,
          items: [],
          summary: {
            subtotal: 0,
            shippingFee: 0,
            freeShippingThreshold: shipping.freeShippingThreshold,
            total: 0,
            itemCount: 0,
          },
        },
      });
    }

    // Get all products for items in cart
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          "name price markedPrice images variants variantStocks categories",
        );
        return {
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          selectedOptions: item.selectedOptions,
          product: product || null,
        };
      }),
    );

    const subtotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );
    const itemCount = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;
    const total = subtotal + shippingFee;

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: itemsWithProducts,
        summary: {
          subtotal,
          shippingFee,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total,
          itemCount,
        },
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADD TO CART ====================
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, selectedOptions = {} } = req.body;
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Clean up selected options (trim whitespace, convert empty to "")
    const cleanOptions = normalizeSelectedOptions(selectedOptions);

    // Validate option 1 if provided
    if (cleanOptions.option1Name) {
      const variant = product.variants.find(
        (v) => v.name === cleanOptions.option1Name,
      );
      if (!variant) {
        return res.status(400).json({
          message: `Variant '${cleanOptions.option1Name}' not found for this product`,
        });
      }
      if (!cleanOptions.option1Value) {
        return res.status(400).json({
          message: "Option 1 name provided but value is missing",
        });
      }
      if (!variant.values.includes(cleanOptions.option1Value)) {
        return res.status(400).json({
          message: `'${cleanOptions.option1Value}' is not a valid value for ${cleanOptions.option1Name}`,
        });
      }
    }

    // Validate option 2 if provided
    if (cleanOptions.option2Name) {
      const variant = product.variants.find(
        (v) => v.name === cleanOptions.option2Name,
      );
      if (!variant) {
        return res.status(400).json({
          message: `Variant '${cleanOptions.option2Name}' not found for this product`,
        });
      }
      if (!cleanOptions.option2Value) {
        return res.status(400).json({
          message: "Option 2 name provided but value is missing",
        });
      }
      if (!variant.values.includes(cleanOptions.option2Value)) {
        return res.status(400).json({
          message: `'${cleanOptions.option2Value}' is not a valid value for ${cleanOptions.option2Name}`,
        });
      }
    }

    // Validate quantity
    const validQuantity = parseInt(quantity, 10);
    if (isNaN(validQuantity) || validQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if same item already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => {
      return (
        item.productId.toString() === productId &&
        item.selectedOptions.option1Name === cleanOptions.option1Name &&
        item.selectedOptions.option1Value === cleanOptions.option1Value &&
        item.selectedOptions.option2Name === cleanOptions.option2Name &&
        item.selectedOptions.option2Value === cleanOptions.option2Value
      );
    });

    const nextQuantity =
      existingItemIndex !== -1
        ? cart.items[existingItemIndex].quantity + validQuantity
        : validQuantity;
    const availableStock = getAvailableStockForSelection(product, cleanOptions);

    if (nextQuantity > availableStock) {
      return res.status(400).json({
        message: `Insufficient stock. Available quantity for selected variant is ${availableStock}`,
      });
    }

    if (existingItemIndex !== -1) {
      // Item already in cart, just increase quantity
      cart.items[existingItemIndex].quantity = nextQuantity;
    } else {
      // New item, add it
      cart.items.push({
        productId,
        quantity: validQuantity,
        priceAtAdd: product.price,
        selectedOptions: cleanOptions,
      });
    }

    // Save cart
    await cart.save();

    // Return cart with product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await Product.findById(item.productId).select(
          "name price markedPrice images variants variantStocks categories",
        );
        return {
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          selectedOptions: item.selectedOptions,
          product: prod || null,
        };
      }),
    );

    const subtotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );
    const itemCount = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;
    const total = subtotal + shippingFee;

    res.status(200).json({
      message: "Item added to cart successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: itemsWithProducts,
        summary: {
          subtotal,
          shippingFee,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total,
          itemCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE CART ITEM ====================
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity, selectedOptions } = req.body;
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find specific item in cart
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Get product details
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updatedOptions = normalizeSelectedOptions(
      cartItem.selectedOptions || {},
    );
    let updatedQuantity = cartItem.quantity;

    // Update quantity if provided
    if (quantity !== undefined) {
      const validQuantity = parseInt(quantity, 10);
      if (isNaN(validQuantity) || validQuantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      updatedQuantity = validQuantity;
    }

    // Update selected options if provided
    if (selectedOptions) {
      const cleanOptions = normalizeSelectedOptions(selectedOptions);

      // Validate option 1 if provided
      if (cleanOptions.option1Name) {
        const variant = product.variants.find(
          (v) => v.name === cleanOptions.option1Name,
        );
        if (!variant) {
          return res.status(400).json({
            message: `Variant '${cleanOptions.option1Name}' not found`,
          });
        }
        if (!cleanOptions.option1Value) {
          return res.status(400).json({
            message: "Option 1 name provided but value is missing",
          });
        }
        if (!variant.values.includes(cleanOptions.option1Value)) {
          return res.status(400).json({
            message: `'${cleanOptions.option1Value}' is not valid for ${cleanOptions.option1Name}`,
          });
        }
      }

      // Validate option 2 if provided
      if (cleanOptions.option2Name) {
        const variant = product.variants.find(
          (v) => v.name === cleanOptions.option2Name,
        );
        if (!variant) {
          return res.status(400).json({
            message: `Variant '${cleanOptions.option2Name}' not found`,
          });
        }
        if (!cleanOptions.option2Value) {
          return res.status(400).json({
            message: "Option 2 name provided but value is missing",
          });
        }
        if (!variant.values.includes(cleanOptions.option2Value)) {
          return res.status(400).json({
            message: `'${cleanOptions.option2Value}' is not valid for ${cleanOptions.option2Name}`,
          });
        }
      }

      updatedOptions = cleanOptions;
    }

    const availableStock = getAvailableStockForSelection(
      product,
      updatedOptions,
    );
    if (updatedQuantity > availableStock) {
      return res.status(400).json({
        message: `Insufficient stock. Available quantity for selected variant is ${availableStock}`,
      });
    }

    cartItem.quantity = updatedQuantity;
    cartItem.selectedOptions = updatedOptions;

    // Save cart
    await cart.save();

    // Return updated cart with product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await Product.findById(item.productId).select(
          "name price markedPrice images variants variantStocks categories",
        );
        return {
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          selectedOptions: item.selectedOptions,
          product: prod || null,
        };
      }),
    );

    const subtotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );
    const itemCount = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;
    const total = subtotal + shippingFee;

    res.status(200).json({
      message: "Item updated successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: itemsWithProducts,
        summary: {
          subtotal,
          shippingFee,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total,
          itemCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== REMOVE CART ITEM ====================
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Delete the item
    cartItem.deleteOne();
    await cart.save();

    // Return updated cart with product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await Product.findById(item.productId).select(
          "name price markedPrice images variants variantStocks categories",
        );
        return {
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          selectedOptions: item.selectedOptions,
          product: prod || null,
        };
      }),
    );

    const subtotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );
    const itemCount = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;
    const total = subtotal + shippingFee;

    res.status(200).json({
      message: "Item removed from cart successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: itemsWithProducts,
        summary: {
          subtotal,
          shippingFee,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total,
          itemCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CLEAR CART ====================
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let shipping = await Shipping.findOne();
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear all items
    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: [],
        summary: {
          subtotal: 0,
          shippingFee: 0,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total: 0,
          itemCount: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== MERGE GUEST CART ====================
export const mergeGuestCart = async (req, res) => {
  try {
    // The logged-in user is the owner of the final merged cart.
    const userId = req.user.id;
    // Guest cart items are sent from the frontend in the request body.
    const { items = [] } = req.body;

    // Load shipping settings so the response summary can reuse the same rules as the rest of the cart API.
    let shipping = await Shipping.findOne();
    if (!shipping) {
      // If shipping settings do not exist yet, create a safe default record.
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    // Guest cart data must be an array because we merge item-by-item.
    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: "items must be an array",
      });
    }

    // Reuse the existing authenticated cart if it exists.
    // If the user has never had a cart before, create an empty one now.
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // We collect failures instead of stopping on the first bad guest item.
    // That way the frontend can see exactly which items were skipped and why.
    const skipped = [];

    // Merge each guest cart item into the logged-in user's cart.
    for (const guestItem of items) {
      // Read the minimum fields we need from the guest item.
      const productId = guestItem?.productId;
      // Default quantity is 1 when the guest cart item does not specify one.
      const quantity = guestItem?.quantity ?? 1;
      // Selected options identify the exact product variant the user picked.
      const selectedOptions = guestItem?.selectedOptions || {};

      // A cart item without a product id cannot be matched to anything.
      if (!productId) {
        skipped.push({ guestItem, reason: "Missing productId" });
        continue;
      }

      // Load the current product from the database.
      // This avoids trusting stale frontend data.
      const product = await Product.findById(productId);
      if (!product) {
        skipped.push({ guestItem, reason: "Product not found" });
        continue;
      }

      // Normalize option strings so comparisons are stable.
      const cleanOptions = normalizeSelectedOptions(selectedOptions);

      // Validate option 1 only if the guest item actually provided it.
      if (cleanOptions.option1Name) {
        const variant = product.variants.find(
          (v) => v.name === cleanOptions.option1Name,
        );
        // The option name must exist and the value must also be present.
        if (!variant || !cleanOptions.option1Value) {
          skipped.push({ guestItem, reason: "Invalid option1" });
          continue;
        }
        // The selected value must be one of the allowed values for that variant.
        if (!variant.values.includes(cleanOptions.option1Value)) {
          skipped.push({ guestItem, reason: "Invalid option1 value" });
          continue;
        }
      }

      // Validate option 2 using the same rules as option 1.
      if (cleanOptions.option2Name) {
        const variant = product.variants.find(
          (v) => v.name === cleanOptions.option2Name,
        );
        if (!variant || !cleanOptions.option2Value) {
          skipped.push({ guestItem, reason: "Invalid option2" });
          continue;
        }
        if (!variant.values.includes(cleanOptions.option2Value)) {
          skipped.push({ guestItem, reason: "Invalid option2 value" });
          continue;
        }
      }

      // Parse quantity into a real number so later checks are reliable.
      const validQuantity = parseInt(quantity, 10);
      if (isNaN(validQuantity) || validQuantity < 1) {
        skipped.push({ guestItem, reason: "Invalid quantity" });
        continue;
      }

      // If the same product + same exact options already exist in the cart,
      // we should increase quantity instead of creating a duplicate row.
      const existingItemIndex = cart.items.findIndex((item) => {
        return (
          item.productId.toString() === productId &&
          item.selectedOptions.option1Name === cleanOptions.option1Name &&
          item.selectedOptions.option1Value === cleanOptions.option1Value &&
          item.selectedOptions.option2Name === cleanOptions.option2Name &&
          item.selectedOptions.option2Value === cleanOptions.option2Value
        );
      });

      // Determine what the final quantity would be after merging.
      const nextQuantity =
        existingItemIndex !== -1
          ? cart.items[existingItemIndex].quantity + validQuantity
          : validQuantity;

      // Check stock against the exact selected product variant.
      const availableStock = getAvailableStockForSelection(
        product,
        cleanOptions,
      );
      if (nextQuantity > availableStock) {
        skipped.push({ guestItem, reason: "Insufficient stock" });
        continue;
      }

      // Merge into the existing line item when possible.
      if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity = nextQuantity;
      } else {
        // Otherwise add a brand new cart line.
        cart.items.push({
          productId,
          quantity: validQuantity,
          priceAtAdd: product.price,
          selectedOptions: cleanOptions,
        });
      }
    }
    // Recalculate totals from the merged cart before sending the response.

    await cart.save();

    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await Product.findById(item.productId).select(
          "name price markedPrice images variants variantStocks categories",
        );
        return {
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
          selectedOptions: item.selectedOptions,
          product: prod || null,
        };
      }),
    );

    const subtotal = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.priceAtAdd,
      0,
    );
    const itemCount = itemsWithProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const shippingFee =
      subtotal === 0
        ? 0
        : shipping.freeShippingThreshold > 0 &&
            subtotal >= shipping.freeShippingThreshold
          ? 0
          : shipping.fee;
    const total = subtotal + shippingFee;

    res.status(200).json({
      message: "Guest cart merged successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: itemsWithProducts,
        summary: {
          subtotal,
          shippingFee,
          freeShippingThreshold: shipping.freeShippingThreshold,
          total,
          itemCount,
        },
      },
      // Let the frontend know it can clear the guest cart from local storage.
      skipped,
      clearGuestCart: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
