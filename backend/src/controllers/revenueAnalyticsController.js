import Order from "../models/Order.js";
import {
  ALLOWED_GROUP_BY,
  addUtcDays,
  calculatePercentageChange,
  getDateRangeFromQuery,
  getPreviousRange,
  getTrendDateFormat,
  startOfUtcDay,
  startOfUtcMonth,
  startOfUtcYear,
} from "../utils/adminAnalyticsHelpers.js";

const getSummaryForRange = async (start, end) => {
  const [result] = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const totalRevenue = Number(result?.totalRevenue || 0);
  const totalOrders = Number(result?.totalOrders || 0);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue:
      totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
  };
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const range = getDateRangeFromQuery(req.query);
    if (range.error) {
      return res.status(400).json({ success: false, message: range.error });
    }

    const groupBy = String(req.query.groupBy || "day").toLowerCase();
    if (!ALLOWED_GROUP_BY.has(groupBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid groupBy. Use day, week, or month.",
      });
    }

    const top = Number.parseInt(req.query.top || "10", 10);
    const safeTop = Number.isFinite(top) && top > 0 ? Math.min(top, 50) : 10;

    const matchStage = {
      isPaid: true,
      paidAt: { $gte: range.start, $lt: range.end },
    };

    const [currentSummary, previousSummary] = await Promise.all([
      getSummaryForRange(range.start, range.end),
      (() => {
        const previousRange = getPreviousRange(range);
        return getSummaryForRange(previousRange.start, previousRange.end);
      })(),
    ]);

    const revenueTrend = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: getTrendDateFormat(groupBy),
              date: "$paidAt",
              timezone: "UTC",
            },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: "$_id",
          revenue: { $round: ["$revenue", 2] },
          orders: 1,
        },
      },
    ]);

    const revenueByPaymentMethod = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          paymentMethod: "$_id",
          revenue: { $round: ["$revenue", 2] },
          orders: 1,
        },
      },
    ]);

    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          revenue: { $sum: "$items.lineTotal" },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: safeTop },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: {
            $ifNull: [
              { $arrayElemAt: ["$product.name", 0] },
              "Deleted Product",
            ],
          },
          revenue: { $round: ["$revenue", 2] },
          unitsSold: 1,
        },
      },
    ]);

    const todayStart = startOfUtcDay(new Date());
    const [today, yesterday, month, year] = await Promise.all([
      getSummaryForRange(todayStart, addUtcDays(todayStart, 1)),
      getSummaryForRange(addUtcDays(todayStart, -1), todayStart),
      getSummaryForRange(
        startOfUtcMonth(new Date()),
        addUtcDays(todayStart, 1),
      ),
      getSummaryForRange(startOfUtcYear(new Date()), addUtcDays(todayStart, 1)),
    ]);

    return res.status(200).json({
      success: true,
      filters: {
        period: range.period,
        startDate: range.start.toISOString(),
        endDateExclusive: range.end.toISOString(),
        groupBy,
        top: safeTop,
      },
      summary: {
        totalRevenue: currentSummary.totalRevenue,
        totalOrders: currentSummary.totalOrders,
        averageOrderValue: currentSummary.averageOrderValue,
        previousPeriodRevenue: previousSummary.totalRevenue,
        previousPeriodOrders: previousSummary.totalOrders,
        revenueChangePercent: calculatePercentageChange(
          currentSummary.totalRevenue,
          previousSummary.totalRevenue,
        ),
        orderChangePercent: calculatePercentageChange(
          currentSummary.totalOrders,
          previousSummary.totalOrders,
        ),
      },
      snapshots: {
        todayRevenue: today.totalRevenue,
        yesterdayRevenue: yesterday.totalRevenue,
        monthRevenue: month.totalRevenue,
        yearRevenue: year.totalRevenue,
      },
      revenueTrend,
      revenueByPaymentMethod,
      topProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
