// shipping model for shipping fee and minimum order amount for free shipping
import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
  fee: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  freeShippingThreshold: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
});

const Shipping = mongoose.model("Shipping", shippingSchema);

export default Shipping;
