import Product from "../models/Product.js";

export const getInventoryAnalytics = async (req, res) => {
  try {
    const thresholdValue = Number.parseInt(req.query.threshold || "5", 10);
    const safeThreshold =
      Number.isFinite(thresholdValue) && thresholdValue >= 0
        ? thresholdValue
        : 5;

    const topValue = Number.parseInt(req.query.top || "10", 10);
    const safeTop =
      Number.isFinite(topValue) && topValue > 0 ? Math.min(topValue, 50) : 10;

    const [summary] = await Product.aggregate([
      {
        $unwind: {
          path: "$variantStocks",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $addToSet: "$_id" },
          totalVariantEntries: {
            $sum: {
              $cond: [{ $ne: ["$variantStocks", null] }, 1, 0],
            },
          },
          totalStockUnits: { $sum: { $ifNull: ["$variantStocks.stock", 0] } },
          outOfStockVariants: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$variantStocks", null] },
                    { $eq: ["$variantStocks.stock", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lowStockVariants: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$variantStocks", null] },
                    { $gt: ["$variantStocks.stock", 0] },
                    { $lte: ["$variantStocks.stock", safeThreshold] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inventoryValue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$price", 0] },
                { $ifNull: ["$variantStocks.stock", 0] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalProducts: { $size: "$totalProducts" },
          totalVariantEntries: 1,
          totalStockUnits: 1,
          outOfStockVariants: 1,
          lowStockVariants: 1,
          inventoryValue: { $round: ["$inventoryValue", 2] },
        },
      },
    ]);

    const lowStockItems = await Product.aggregate([
      {
        $unwind: "$variantStocks",
      },
      {
        $match: {
          "variantStocks.stock": { $lte: safeThreshold },
        },
      },
      {
        $sort: { "variantStocks.stock": 1, updatedAt: -1 },
      },
      { $limit: safeTop },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: "$name",
          price: 1,
          variant: "$variantStocks",
          stock: "$variantStocks.stock",
          inventoryValue: {
            $round: [
              {
                $multiply: [
                  { $ifNull: ["$price", 0] },
                  { $ifNull: ["$variantStocks.stock", 0] },
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      filters: {
        threshold: safeThreshold,
        top: safeTop,
      },
      summary: summary || {
        totalProducts: 0,
        totalVariantEntries: 0,
        totalStockUnits: 0,
        outOfStockVariants: 0,
        lowStockVariants: 0,
        inventoryValue: 0,
      },
      lowStockItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
