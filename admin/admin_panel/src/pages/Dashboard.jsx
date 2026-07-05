import React, { useEffect, useMemo, useState } from "react";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const periodOptions = [
  { value: "month", label: "Month" },
  { value: "last3months", label: "3 months" },
  { value: "last6months", label: "6 months" },
  { value: "custom", label: "Custom" },
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
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatBucketLabel = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const Dashboard = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("groupBy", period === "custom" ? "day" : "week");

      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }

      const [
        revenueResponse,
        ordersResponse,
        inventoryResponse,
        usersResponse,
      ] = await Promise.all([
        adminApi.get(`/api/admin/analytics/revenue?${params.toString()}`, {
          headers: getAdminAuthHeaders(),
        }),
        adminApi.get("/api/orders/admin/all", {
          headers: getAdminAuthHeaders(),
        }),
        adminApi.get("/api/admin/analytics/inventory?top=5", {
          headers: getAdminAuthHeaders(),
        }),
        adminApi.get("/api/admin/analytics/users?period=month&groupBy=day", {
          headers: getAdminAuthHeaders(),
        }),
      ]);

      const revenueData = revenueResponse.data || {};
      const ordersData = ordersResponse.data || {};
      const inventoryData = inventoryResponse.data || {};
      const usersData = usersResponse.data || {};

      const allOrders = ordersData.orders || [];

      setSummary({
        totalRevenue: revenueData.summary?.totalRevenue || 0,
        totalOrders: revenueData.summary?.totalOrders || allOrders.length,
        totalProducts: inventoryData.summary?.totalProducts || 0,
        totalUsers: usersData.summary?.totalUsers || 0,
        revenueChangePercent: revenueData.summary?.revenueChangePercent,
      });
      setTrend(revenueData.revenueTrend || []);
      setRecentOrders(allOrders.slice(0, 5));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, startDate, endDate]);

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

  const statCards = [
    {
      label: "Total Revenue",
      value: formatMoney(summary?.totalRevenue),
      note:
        summary?.revenueChangePercent != null
          ? `${summary.revenueChangePercent}% vs previous`
          : "Tracked from the selected range",
    },
    {
      label: "Orders",
      value: Number(summary?.totalOrders || 0).toLocaleString(),
      note: "Paid and unpaid orders in range",
    },
    {
      label: "Products",
      value: Number(summary?.totalProducts || 0).toLocaleString(),
      note: "Live inventory total",
    },
    {
      label: "Users",
      value: Number(summary?.totalUsers || 0).toLocaleString(),
      note: "Registered accounts",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Live store overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Revenue, orders, products, and users in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500">
              <FiFilter />
              Filter
            </div>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${period === option.value ? "bg-black text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={period !== "custom"}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={period !== "custom"}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {period === "custom" ? "Custom range" : "Preset range"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-900">
              {stat.value}
            </h3>
            <p className="mt-2 text-sm text-emerald-600">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Revenue trend
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Selected period
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {trend.length} points
            </span>
          </div>

          <div className="mt-5 flex min-h-80 items-end gap-3 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
            {loading ? (
              <div className="w-full py-20 text-center text-slate-500">
                Loading dashboard...
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
                    {formatBucketLabel(point.bucket)}
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
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Recent orders
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Latest activity
          </h3>

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
                      {formatMoney(order.totalPrice)}
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
    </div>
  );
};

export default Dashboard;
