import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    markedPrice: {
      type: Number,
      min: 0,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    no_Reviews: {
      type: Number,
      default: 0,
    },
    variants: [
      {
        name: {
          type: String,
          trim: true,
          default: "",
        },
        values: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
    variantStocks: [
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
        stock: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
