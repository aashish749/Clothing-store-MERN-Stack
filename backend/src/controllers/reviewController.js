import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

const updateProductReviewStats = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const product = await Product.findById(productId);
  if (!product) {
    return;
  }

  if (!stats.length) {
    product.rating = 0;
    product.no_Reviews = 0;
  } else {
    product.rating = Number(stats[0].averageRating.toFixed(1));
    product.no_Reviews = stats[0].count;
  }

  await product.save();
};

const hasPurchasedProduct = async (userId, productId) => {
  const order = await Order.findOne({
    userId,
    "items.productId": productId,
    orderStatus: { $ne: "Cancelled" },
    $or: [{ isPaid: true }, { paymentMethod: "COD" }],
  });

  return Boolean(order);
};

// @desc    Add review for a product
// @route   POST /api/products/:id/reviews
// @access  Private
export const addProductReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const parsedRating = Number(rating);
    if (
      !Number.isFinite(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    const purchased = await hasPurchasedProduct(req.user.id, productId);
    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: "Only customers who bought this product can review it",
      });
    }

    const existingReview = await Review.findOne({
      productId,
      userId: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      productId,
      userId: req.user.id,
      reviewerName: req.user.name,
      rating: parsedRating,
      comment: comment || "",
      reviewType: "internal",
      sourcePlatform: "",
    });

    await updateProductReviewStats(productId);

    const populatedReview = await Review.findById(review._id).populate(
      "userId",
      "name email",
    );

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: populatedReview,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    console.error("addProductReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("getProductReviews error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    const isOwner = review.userId.toString() === req.user.id;
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const productId = review.productId;
    await review.deleteOne();
    await updateProductReviewStats(productId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Admin add review for a product
// @route   POST /api/reviews/admin
// @access  Private/Admin
export const addAdminReview = async (req, res) => {
  try {
    const {
      productId,
      reviewerName,
      rating,
      comment = "",
      sourcePlatform = "",
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    if (!reviewerName || !reviewerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "reviewerName is required",
      });
    }

    const adminUserId = req.user?._id || req.user?.id;
    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const parsedRating = Number(rating);
    if (
      !Number.isFinite(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    const review = await Review.create({
      productId,
      userId: adminUserId,
      reviewerName: reviewerName.trim(),
      rating: parsedRating,
      comment: comment || "",
      reviewType: "imported",
      sourcePlatform: sourcePlatform || "",
    });

    await updateProductReviewStats(productId);

    const populatedReview = await Review.findById(review._id).populate(
      "userId",
      "name email",
    );

    return res.status(201).json({
      success: true,
      message: "Admin review added successfully",
      review: populatedReview,
    });
  } catch (err) {
    console.error("addAdminReview error:", err);

    if (
      err?.name === "ValidationError" ||
      err?.name === "CastError" ||
      err?.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Admin add many reviews at once
// @route   POST /api/reviews/admin/bulk
// @access  Private/Admin
export const addAdminReviewsBulk = async (req, res) => {
  try {
    const { reviews } = req.body;

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: "reviews must be a non-empty array",
      });
    }

    const createdReviews = [];
    const affectedProducts = new Set();

    for (const item of reviews) {
      const {
        productId,
        reviewerName,
        rating,
        comment = "",
        sourcePlatform = "",
      } = item || {};

      if (!productId || !reviewerName || !reviewerName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Each review must contain productId and reviewerName",
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for productId ${productId}`,
        });
      }

      const parsedRating = Number(rating);
      if (
        !Number.isFinite(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Each rating must be a number between 1 and 5",
        });
      }

      const review = await Review.create({
        productId,
        userId: req.user.id,
        reviewerName: reviewerName.trim(),
        rating: parsedRating,
        comment: comment || "",
        reviewType: "imported",
        sourcePlatform: sourcePlatform || "",
      });

      createdReviews.push(review);
      affectedProducts.add(productId.toString());
    }

    for (const productId of affectedProducts) {
      await updateProductReviewStats(productId);
    }

    const populatedReviews = await Review.find({
      _id: { $in: createdReviews.map((review) => review._id) },
    }).populate("userId", "name email");

    return res.status(201).json({
      success: true,
      message: "Bulk reviews added successfully",
      reviews: populatedReviews,
    });
  } catch (err) {
    console.error("addAdminReviewsBulk error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("productId", "name images")
      .populate("userId", "name email");

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("getAllReviewsAdmin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
