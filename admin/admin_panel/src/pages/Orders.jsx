import React, { useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiCheck, FiSearch, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const statusOptions = [
  "Pending",
  "PaymentFailed",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const paymentOptions = ["COD", "STRIPE"];

const statusStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  PaymentFailed: "border-rose-200 bg-rose-50 text-rose-700",
  Confirmed: "border-sky-200 bg-sky-50 text-sky-700",
  Shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

const paymentStyles = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Unpaid: "border-rose-200 bg-rose-50 text-rose-700",
};

const getOrderRowAccent = (order) => {
  if (order.orderStatus === "Cancelled") return "border-l-slate-300";
  if (order.orderStatus === "Delivered") return "border-l-emerald-400";
  if (order.orderStatus === "Shipped") return "border-l-indigo-400";
  if (order.orderStatus === "Confirmed") return "border-l-sky-400";
  if (order.orderStatus === "PaymentFailed") return "border-l-rose-400";
  return "border-l-amber-400";
};

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${statusStyles[value] || "border-slate-200 bg-slate-50 text-slate-600"}`}
  >
    {value === "PaymentFailed" ? "Payment failed" : value}
  </span>
);

const PaymentBadge = ({ isPaid }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${paymentStyles[isPaid ? "Paid" : "Unpaid"]}`}
  >
    {isPaid ? "Paid" : "Unpaid"}
  </span>
);

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [isPaid, setIsPaid] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/orders/admin/all", {
        headers: getAdminAuthHeaders(),
      });
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetails = async (orderId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedOrder(null);

    try {
      const { data } = await adminApi.get(`/api/orders/${orderId}`, {
        headers: getAdminAuthHeaders(),
      });
      const order = data.order || null;
      setSelectedOrder(order);
      setOrderStatus(order?.orderStatus || "Pending");
      setIsPaid(Boolean(order?.isPaid));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load order");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetails = () => {
    if (saving) return;
    setDetailOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder?._id) return;

    setSaving(true);
    try {
      const { data } = await adminApi.put(
        `/api/orders/admin/${selectedOrder._id}/status`,
        {
          orderStatus,
          isPaid,
        },
        {
          headers: getAdminAuthHeaders(),
        },
      );

      const updatedOrder = data.order || null;
      setSelectedOrder(updatedOrder);
      setOrders((current) =>
        current.map((order) =>
          order._id === updatedOrder?._id ? updatedOrder : order,
        ),
      );
      toast.success("Order updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        status === "all" || String(order.orderStatus) === status;
      const matchesSearch =
        !search ||
        String(order._id).toLowerCase().includes(search) ||
        String(order.userId?.name || order.userId?.email || "")
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [orders, query, status]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((order) => order.isPaid).length;
    const pending = orders.filter(
      (order) => order.orderStatus === "Pending",
    ).length;
    const shipped = orders.filter(
      (order) => order.orderStatus === "Shipped",
    ).length;

    return [
      { label: "Orders", value: total },
      { label: "Paid", value: paid },
      { label: "Pending", value: pending },
      { label: "Shipped", value: shipped },
    ];
  }, [orders]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Orders
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Order list
        </h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-slate-900">
                {metric.value}
              </h3>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FiSearch className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order or customer"
              className="w-full bg-transparent outline-none"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          >
            <option value="all">All status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="PaymentFailed">Payment failed</option>
          </select>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Order</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Total</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className={`cursor-pointer border-l-4 transition-colors hover:bg-slate-50 ${getOrderRowAccent(order)}`}
                    onClick={() => openOrderDetails(order._id)}
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openOrderDetails(order._id);
                        }}
                        className="inline-flex items-center gap-2 text-left font-semibold text-slate-900 hover:text-slate-600"
                      >
                        #{order._id?.slice(-8)?.toUpperCase()}
                        <FiArrowRight className="text-xs" />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.userId?.name || order.userId?.email || "Customer"}
                    </td>
                    <td className="px-5 py-4 text-slate-900">
                      {formatMoney(order.totalPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <PaymentBadge isPaid={order.isPaid} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Order details
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedOrder?._id
                    ? `#${selectedOrder._id.slice(-8).toUpperCase()}`
                    : "Loading..."}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeOrderDetails}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                {detailLoading ? (
                  <div className="py-16 text-center text-slate-500">
                    Loading order...
                  </div>
                ) : selectedOrder ? (
                  <div className="space-y-5">
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Total",
                          value: formatMoney(selectedOrder.totalPrice),
                        },
                        {
                          label: "Status",
                          value: (
                            <StatusBadge value={selectedOrder.orderStatus} />
                          ),
                        },
                        {
                          label: "Payment",
                          value: <PaymentBadge isPaid={selectedOrder.isPaid} />,
                        },
                        {
                          label: "Date",
                          value: formatDateTime(selectedOrder.createdAt),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            {item.label}
                          </p>
                          <div className="mt-2 text-base font-semibold text-slate-900">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Customer
                      </p>
                      <div className="mt-3 space-y-1 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">
                          {selectedOrder.userId?.name || "Customer"}
                        </p>
                        <p>{selectedOrder.userId?.email || "-"}</p>
                        <p>{selectedOrder.shippingAddress?.phone || "-"}</p>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Shipping address
                      </p>
                      <div className="mt-3 space-y-1 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">
                          {selectedOrder.shippingAddress?.fullName || "-"}
                        </p>
                        <p>{selectedOrder.shippingAddress?.line1 || "-"}</p>
                        <p>
                          {selectedOrder.shippingAddress?.line2 || ""}
                          {selectedOrder.shippingAddress?.line2 ? ", " : ""}
                          {selectedOrder.shippingAddress?.city || ""}
                          {selectedOrder.shippingAddress?.city ? ", " : ""}
                          {selectedOrder.shippingAddress?.state || ""}
                          {selectedOrder.shippingAddress?.state ? ", " : ""}
                          {selectedOrder.shippingAddress?.postalCode || ""}
                        </p>
                        <p>{selectedOrder.shippingAddress?.country || "-"}</p>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Items
                      </p>
                      <div className="mt-4 space-y-3">
                        {(selectedOrder.items || []).map((item) => (
                          <div
                            key={item._id}
                            className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-3"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.productId?.name || "Product"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Qty {item.quantity} ·{" "}
                                {formatMoney(item.priceAtOrder)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {[
                                  item.selectedOptions?.option1Name &&
                                  item.selectedOptions?.option1Value
                                    ? `${item.selectedOptions.option1Name}: ${item.selectedOptions.option1Value}`
                                    : null,
                                  item.selectedOptions?.option2Name &&
                                  item.selectedOptions?.option2Value
                                    ? `${item.selectedOptions.option2Name}: ${item.selectedOptions.option2Value}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "No variants"}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {formatMoney(item.lineTotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Edit order
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Status and payment
                </h3>

                <div className="mt-5 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <select
                      value={orderStatus}
                      onChange={(event) => setOrderStatus(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "PaymentFailed"
                            ? "Payment failed"
                            : option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Payment
                    </span>
                    <select
                      value={selectedOrder?.paymentMethod || "COD"}
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-500 outline-none"
                    >
                      {paymentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Mark as paid
                      </p>
                      <p className="text-xs text-slate-500">
                        {isPaid ? "Paid" : "Unpaid"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPaid((current) => !current)}
                      className={`inline-flex h-11 w-20 items-center rounded-full p-1 transition-colors ${isPaid ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" : "bg-rose-400 shadow-[0_0_0_4px_rgba(248,113,113,0.12)]"}`}
                    >
                      <span
                        className={`h-9 w-9 rounded-full bg-white shadow-sm transition-transform ${isPaid ? "translate-x-9" : "translate-x-0"}`}
                      />
                    </button>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={saving || detailLoading || !selectedOrder}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiCheck />
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Orders;
