import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerName: {
      type: String,
      trim: true,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    reviewType: {
      type: String,
      enum: ["internal", "imported"],
      default: "internal",
    },
    sourcePlatform: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

reviewSchema.index(
  { productId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewType: "internal" },
  },
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
