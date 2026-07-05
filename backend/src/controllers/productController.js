import Category from "../models/category.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseNumberField = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const parseVariantStockEntries = (value) => {
  return parseArrayField(value).map((entry) => ({
    option1Name: String(entry?.option1Name || "").trim(),
    option1Value: String(entry?.option1Value || "").trim(),
    option2Name: String(entry?.option2Name || "").trim(),
    option2Value: String(entry?.option2Value || "").trim(),
    stock: parseNumberField(entry?.stock, NaN),
  }));
};

const validateVariantStocks = (variantStocks = []) => {
  if (!Array.isArray(variantStocks) || variantStocks.length === 0) {
    return {
      valid: false,
      message:
        "variantStocks is required. For non-variant products, send one entry with empty option names/values.",
    };
  }

  const hasInvalidEntry = variantStocks.some(
    (entry) =>
      Number.isNaN(entry.stock) ||
      entry.stock < 0 ||
      (entry.option1Value && !entry.option1Name) ||
      (entry.option2Value && !entry.option2Name),
  );

  if (hasInvalidEntry) {
    return {
      valid: false,
      message:
        "variantStocks entries must have valid stock and matching option names",
    };
  }

  return { valid: true };
};

// @desc    Upload product images to Cloudinary
// @route   POST /api/products/upload-images
// @access  Private/Admin
export const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const images = req.files.map((file) => file.path);
    const uploaded = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images,
      uploaded,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// @desc    Create or add product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      markedPrice,
      categories,
      images,
      variants,
      variantStocks,
    } = req.body;

    const parsedPrice = parseNumberField(price, NaN);
    const parsedMarkedPrice = parseNumberField(markedPrice, NaN);

    // Supports both JSON body arrays and FormData stringified arrays.
    const selectedCategories = parseArrayField(categories);
    const parsedVariants = parseArrayField(variants);
    const parsedVariantStocks = parseVariantStockEntries(variantStocks);
    const bodyImages = parseArrayField(images);
    // For one-step FormData flow, multer stores uploaded Cloudinary URLs in req.files.
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => file.path)
      : [];
    const finalImages = [...bodyImages, ...uploadedImages].filter(Boolean);

    if (!name && (price === undefined || price === null || price === "")) {
      return res.status(400).json({
        success: false,
        message: "name and price are required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "price is required",
      });
    }

    if (Number.isNaN(parsedPrice)) {
      return res.status(400).json({
        success: false,
        message: "price must be a valid number",
      });
    }

    const variantStocksValidation = validateVariantStocks(parsedVariantStocks);
    if (!variantStocksValidation.valid) {
      return res.status(400).json({
        success: false,
        message: variantStocksValidation.message,
      });
    }

    if (
      selectedCategories.some(
        (categoryId) => !mongoose.Types.ObjectId.isValid(categoryId),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "categories must contain valid category ids",
      });
    }

    if (selectedCategories.length > 0) {
      const existingCategories = await Category.find({
        _id: { $in: selectedCategories },
      }).select("_id");

      if (existingCategories.length !== selectedCategories.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid category id(s)",
        });
      }
    }

    const productData = {
      name,
      description: description || "",
      price: parsedPrice,
      categories: selectedCategories,
      images: finalImages,
      variants: parsedVariants,
      variantStocks: parsedVariantStocks,
    };

    if (
      markedPrice !== undefined &&
      markedPrice !== null &&
      markedPrice !== ""
    ) {
      if (Number.isNaN(parsedMarkedPrice)) {
        return res.status(400).json({
          success: false,
          message: "markedPrice must be a valid number",
        });
      }
      productData.markedPrice = parsedMarkedPrice;
    }

    const newProduct = await Product.create(productData);

    return res.status(201).json({
      success: true,
      product: newProduct,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
//update product details by admin
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      markedPrice,
      categories,
      images,
      variants,
      variantStocks,
    } = req.body;
    const productId = req.params.id;

    const parsedPrice = parseNumberField(price, NaN);
    const parsedMarkedPrice = parseNumberField(markedPrice, NaN);

    // Supports both JSON arrays and FormData stringified arrays.
    const selectedCategories = parseArrayField(categories);
    const parsedVariants = parseArrayField(variants);
    const parsedVariantStocks = parseVariantStockEntries(variantStocks);
    const bodyImages = parseArrayField(images);
    const uploadedImages = Array.isArray(req.files)
      ? req.files.map((file) => file.path)
      : [];
    const finalImages = [...bodyImages, ...uploadedImages].filter(Boolean);

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (categories !== undefined) {
      if (
        selectedCategories.some(
          (categoryId) => !mongoose.Types.ObjectId.isValid(categoryId),
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "categories must contain valid category ids",
        });
      }

      const existingCategories = await Category.find({
        _id: { $in: selectedCategories },
      }).select("_id");

      if (existingCategories.length !== selectedCategories.length) {
        return res.status(400).json({
          success: false,
          message: "Invalid category id(s)",
        });
      }
      product.categories = selectedCategories;
    }

    product.name = name || product.name;
    product.description = description || product.description;
    if (price !== undefined) {
      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({
          success: false,
          message: "price must be a valid number",
        });
      }
      product.price = parsedPrice;
    }

    if (markedPrice !== undefined) {
      if (markedPrice === null || markedPrice === "") {
        product.markedPrice = undefined;
      } else {
        if (Number.isNaN(parsedMarkedPrice)) {
          return res.status(400).json({
            success: false,
            message: "markedPrice must be a valid number",
          });
        }
        product.markedPrice = parsedMarkedPrice;
      }
    }

    if (images !== undefined || uploadedImages.length > 0) {
      product.images = finalImages;
    }

    if (variants !== undefined) {
      product.variants = parsedVariants;
    }

    if (variantStocks !== undefined) {
      const variantStocksValidation =
        validateVariantStocks(parsedVariantStocks);
      if (!variantStocksValidation.valid) {
        return res.status(400).json({
          success: false,
          message: variantStocksValidation.message,
        });
      }

      product.variantStocks = parsedVariantStocks;
    }

    await product.save();

    return res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

//Delete product by admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//@desc get all products with pagination and search and filter by category and price range and rating
//@route GET /api/products
//@access Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const sortBy = String(req.query.sortBy || "createdAt").toLowerCase();
    const sortOrder = String(req.query.sortOrder || "desc").toLowerCase();
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    const categoryFilter = req.query.category
      ? { categories: req.query.category }
      : {};

    const priceFilter =
      req.query.minPrice != null && req.query.maxPrice != null
        ? {
            price: {
              $gte: Number(req.query.minPrice),
              $lte: Number(req.query.maxPrice),
            },
          }
        : {};

    const ratingFilter =
      req.query.minRating != null || req.query.maxRating != null
        ? {
            rating: {
              ...(req.query.minRating != null && {
                $gte: Number(req.query.minRating),
              }),
              ...(req.query.maxRating != null && {
                $lte: Number(req.query.maxRating),
              }),
            },
          }
        : {};

    const count = await Product.countDocuments({
      ...keyword,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    const products = await Product.find({
      ...keyword,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    }).populate("categories", "name description");

    const getProductStock = (product) =>
      (product.variantStocks || []).reduce(
        (sum, stockRow) => sum + Number(stockRow?.stock || 0),
        0,
      );

    let salesMap = new Map();
    if (sortBy === "sales") {
      const salesSummary = await Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            unitsSold: { $sum: "$items.quantity" },
          },
        },
      ]);

      salesMap = new Map(
        salesSummary.map((entry) => [
          String(entry._id),
          Number(entry.unitsSold),
        ]),
      );
    }

    const getSortableValue = (product) => {
      switch (sortBy) {
        case "price":
          return Number(product.price || 0);
        case "rating":
          return Number(product.rating || 0);
        case "stock":
          return getProductStock(product);
        case "sales":
          return salesMap.get(String(product._id)) || 0;
        case "createdat":
        default:
          return new Date(product.createdAt || 0).getTime();
      }
    };

    const sortedProducts = [...products].sort((left, right) => {
      const leftValue = getSortableValue(left);
      const rightValue = getSortableValue(right);

      if (leftValue < rightValue) return -1 * sortDirection;
      if (leftValue > rightValue) return 1 * sortDirection;
      return 0;
    });

    const paginatedProducts = sortedProducts.slice(
      pageSize * (page - 1),
      pageSize * page,
    );

    return res.json({
      success: true,
      products: paginatedProducts,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Get single product details (public)
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categories",
      "name description",
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
