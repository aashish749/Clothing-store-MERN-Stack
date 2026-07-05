import Order from "../models/Order.js";
import User from "../models/User.js";
import {
  ALLOWED_GROUP_BY,
  addUtcDays,
  calculatePercentageChange,
  getDateRangeFromQuery,
  getPreviousRange,
  getTrendDateFormat,
  startOfUtcDay,
} from "../utils/adminAnalyticsHelpers.js";

const getSignupSummaryForRange = async (start, end) => {
  const totalUsers = await User.countDocuments({
    createdAt: { $gte: start, $lt: end },
  });

  return { totalUsers };
};

const getActiveBuyerCountForRange = async (start, end) => {
  const buyers = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        paidAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: "$userId",
      },
    },
    {
      $count: "count",
    },
  ]);

  return Number(buyers?.[0]?.count || 0);
};

export const getUserAnalytics = async (req, res) => {
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

    const matchStage = {
      createdAt: { $gte: range.start, $lt: range.end },
    };

    const [
      totalUsers,
      currentSummary,
      previousSummary,
      activeBuyers,
      previousActiveBuyers,
    ] = await Promise.all([
      User.countDocuments(),
      getSignupSummaryForRange(range.start, range.end),
      (() => {
        const previousRange = getPreviousRange(range);
        return getSignupSummaryForRange(previousRange.start, previousRange.end);
      })(),
      getActiveBuyerCountForRange(range.start, range.end),
      (() => {
        const previousRange = getPreviousRange(range);
        return getActiveBuyerCountForRange(
          previousRange.start,
          previousRange.end,
        );
      })(),
    ]);

    const signupTrend = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: getTrendDateFormat(groupBy),
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: "$_id",
          users: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      filters: {
        period: range.period,
        startDate: range.start.toISOString(),
        endDateExclusive: range.end.toISOString(),
        groupBy,
      },
      summary: {
        totalUsers,
        newUsers: currentSummary.totalUsers,
        previousPeriodNewUsers: previousSummary.totalUsers,
        newUsersChangePercent: calculatePercentageChange(
          currentSummary.totalUsers,
          previousSummary.totalUsers,
        ),
        activeBuyers,
        previousPeriodActiveBuyers: previousActiveBuyers,
        activeBuyerChangePercent: calculatePercentageChange(
          activeBuyers,
          previousActiveBuyers,
        ),
      },
      signupTrend,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
