import Shipping from "../models/ShippingModel.js";

// ==================== GET SHIPPING SETTINGS ====================
export const getShipping = async (req, res) => {
  try {
    // Find the one shipping settings document
    let shipping = await Shipping.findOne();

    // If no document exists yet, create default
    if (!shipping) {
      shipping = await Shipping.create({
        fee: 0,
        freeShippingThreshold: 0,
      });
    }

    res.status(200).json({
      message: "Shipping settings retrieved",
      shipping,
    });
  } catch (error) {
    console.error("getShipping error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE SHIPPING SETTINGS ====================
export const updateShipping = async (req, res) => {
  try {
    const { fee, freeShippingThreshold } = req.body;

    // Validate inputs
    if (fee !== undefined && (isNaN(fee) || fee < 0)) {
      return res.status(400).json({
        message: "fee must be a number >= 0",
      });
    }

    if (
      freeShippingThreshold !== undefined &&
      (isNaN(freeShippingThreshold) || freeShippingThreshold < 0)
    ) {
      return res.status(400).json({
        message: "freeShippingThreshold must be a number >= 0",
      });
    }

    // Find and update the one shipping document
    let shipping = await Shipping.findOne();

    if (!shipping) {
      // Create if doesn't exist
      shipping = new Shipping();
    }

    // Update only provided fields
    if (fee !== undefined) {
      shipping.fee = fee;
    }
    if (freeShippingThreshold !== undefined) {
      shipping.freeShippingThreshold = freeShippingThreshold;
    }

    await shipping.save();

    res.status(200).json({
      message: "Shipping settings updated successfully",
      shipping,
    });
  } catch (error) {
    console.error("updateShipping error:", error);
    res.status(500).json({ message: error.message });
  }
};
