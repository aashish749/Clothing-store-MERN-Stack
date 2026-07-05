import React, { useEffect, useMemo, useState } from "react";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const periodOptions = [
  { value: "month", label: "This month" },
  { value: "last3months", label: "Last 3 months" },
  { value: "last6months", label: "Last 6 months" },
  { value: "custom", label: "Custom" },
];

const groupByOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getOrderTotal = (order) => Number(order?.totalPrice || 0);

const Analytics = () => {
  const [period, setPeriod] = useState("month");
  const [groupBy, setGroupBy] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);

      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }

      params.set("groupBy", groupBy);
      params.set("top", "10");

      const [revenueResponse, ordersResponse] = await Promise.all([
        adminApi.get(`/api/admin/analytics/revenue?${params.toString()}`, {
          headers: getAdminAuthHeaders(),
        }),
        adminApi.get("/api/orders/admin/all", {
          headers: getAdminAuthHeaders(),
        }),
      ]);

      const revenueData = revenueResponse.data || {};
      const ordersData = ordersResponse.data || {};

      setSummary(revenueData.summary || null);
      setSnapshots(revenueData.snapshots || null);
      setTrend(revenueData.revenueTrend || []);
      setRecentOrders((ordersData.orders || []).slice(0, 8));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, groupBy, startDate, endDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const chartMax = Math.max(
    ...trend.map((item) => Number(item.revenue || 0)),
    1,
  );

  const chartData = useMemo(
    () =>
      trend.map((item) => ({
        ...item,
        height: Math.max((Number(item.revenue || 0) / chartMax) * 100, 6),
      })),
    [trend, chartMax],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Analytics
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Revenue overview
            </h1>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_220px_220px]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FiFilter className="text-slate-400" />
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full bg-transparent outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <select
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            {groupByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={period !== "custom"}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            disabled={period !== "custom"}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {period === "custom" ? (
          <div className="mt-3 text-xs text-slate-500">
            Use start and end dates for custom range.
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatMoney(summary?.totalRevenue) },
          {
            label: "Orders",
            value: Number(summary?.totalOrders || 0).toLocaleString(),
          },
          {
            label: "Avg Order",
            value: formatMoney(summary?.averageOrderValue),
          },
          {
            label: "Revenue Change",
            value:
              summary?.revenueChangePercent != null
                ? `${summary.revenueChangePercent}%`
                : "0%",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-900">
              {item.value}
            </h3>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Revenue chart
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Trend by {groupBy}
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {trend.length} points
            </span>
          </div>

          <div className="mt-5 flex min-h-80 items-end gap-3 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
            {loading ? (
              <div className="w-full py-20 text-center text-slate-500">
                Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="w-full py-20 text-center text-slate-500">
                No revenue data for this range.
              </div>
            ) : (
              chartData.map((point) => (
                <div
                  key={point.bucket}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-64 w-full items-end justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-3xl bg-black/85"
                      style={{ height: `${point.height}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formatDateLabel(point.bucket)}
                  </p>
                  <p className="text-[11px] font-medium text-slate-900">
                    {formatMoney(point.revenue)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Recent orders
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Latest activity
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                No recent orders.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {order._id?.slice(-6)?.toUpperCase() || "ORDER"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.userId?.name ||
                          order.userId?.email ||
                          "Customer"}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatMoney(getOrderTotal(order))}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                      {order.orderStatus || "Pending"}
                    </span>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                      {order.paymentMethod || "-"}
                    </span>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Summary
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Today", value: formatMoney(snapshots?.todayRevenue) },
            {
              label: "Yesterday",
              value: formatMoney(snapshots?.yesterdayRevenue),
            },
            { label: "Month", value: formatMoney(snapshots?.monthRevenue) },
            { label: "Year", value: formatMoney(snapshots?.yearRevenue) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analytics;
