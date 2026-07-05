import mongoose from "mongoose";

const selectedOptionsSchema = new mongoose.Schema(
  {
    option1Name: {
      type: String,
      trim: true,
      default: "",
    },
    option1Value: {
      type: String,
      trim: true,
      default: "",
    },
    option2Name: {
      type: String,
      trim: true,
      default: "",
    },
    option2Value: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    // Snapshot price when added. Final checkout should always revalidate.
    priceAtAdd: {
      type: Number,
      default: 0,
      min: 0,
    },
    selectedOptions: {
      type: selectedOptionsSchema,
      default: () => ({}),
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
