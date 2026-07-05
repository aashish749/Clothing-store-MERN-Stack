import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNotify } from "../hooks/useNotify";

const badgeStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  PaymentFailed: "border-red-200 bg-red-50 text-red-700",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Shipped: "border-blue-200 bg-blue-50 text-blue-700",
  Delivered: "border-gray-200 bg-gray-50 text-gray-700",
  Cancelled: "border-gray-200 bg-gray-100 text-gray-600",
};

const paymentBadgeStyles = {
  COD: "border-gray-200 bg-gray-50 text-gray-700",
  STRIPE: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const Orders = () => {
  const notify = useNotify();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await axios.get(`${apiBaseUrl}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data?.orders || []);
      } catch (error) {
        notify.error(
          error?.response?.data?.message || "Unable to load your orders.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <div className="container py-12 sm:py-16 border-t border-gray-200">
        <div className="max-w-2xl mx-auto rounded-none border border-gray-200 bg-white p-6 sm:p-8 shadow-sm text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
            My Orders
          </p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-medium text-gray-900">
            Please log in first
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            You need to sign in to view your order history.
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-none border border-black bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-200"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-10 border-t border-gray-200 min-h-[60vh]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
              Order history
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-medium text-gray-900">
              My Orders
            </h1>
          </div>
          <Link
            to="/collection"
            className="rounded-none border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
          >
            Continue shopping
          </Link>
        </div>

        <div className="mt-8 space-y-4 sm:space-y-5">
          {loading ? (
            <div className="rounded-none border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-none border border-gray-200 bg-white p-8 sm:p-10 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900">
                No orders yet
              </h2>
              <p className="mt-3 text-sm text-gray-600 max-w-xl">
                When you place an order, it will appear here with status,
                payment method, and shipping details.
              </p>
              <div className="mt-6">
                <Link
                  to="/collection"
                  className="inline-flex items-center justify-center rounded-none bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors duration-200"
                >
                  Start shopping
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <article
                key={order._id}
                className="rounded-none border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h2 className="text-base sm:text-xl font-medium text-gray-900">
                        Order #{order._id?.slice(-6)?.toUpperCase()}
                      </h2>
                      <span
                        className={`rounded-none border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${badgeStyles[order.orderStatus] || "border-gray-200 bg-gray-50 text-gray-700"}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span
                        className={`rounded-none border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${paymentBadgeStyles[order.paymentMethod] || "border-gray-200 bg-gray-50 text-gray-700"}`}
                      >
                        {order.paymentMethod}
                      </span>
                      <span
                        className={`rounded-none border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${order.isPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                      Shipping to {order.shippingAddress?.fullName},{" "}
                      {order.shippingAddress?.city}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 lg:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      Total
                    </p>
                    <p className="text-2xl font-medium text-gray-900">
                      ${Number(order.totalPrice || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {order.items?.map((item) => {
                    const product = item.productId || {};
                    const image =
                      product.images?.[0] ||
                      "https://via.placeholder.com/120x140?text=No+Image";
                    const selectedOptions = item.selectedOptions || {};
                    const optionLabels = [
                      selectedOptions.option1Name &&
                      selectedOptions.option1Value
                        ? `${selectedOptions.option1Name}: ${selectedOptions.option1Value}`
                        : null,
                      selectedOptions.option2Name &&
                      selectedOptions.option2Value
                        ? `${selectedOptions.option2Name}: ${selectedOptions.option2Value}`
                        : null,
                    ].filter(Boolean);

                    return (
                      <div
                        key={item._id}
                        className="grid grid-cols-[44px_1fr_auto] gap-3 rounded-none border border-gray-200 p-3 sm:flex sm:items-center sm:p-4"
                      >
                        <div className="h-14 w-11 overflow-hidden border border-gray-200 bg-gray-50 sm:h-20 sm:w-16">
                          <img
                            src={image}
                            alt={product.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 self-center">
                          <h3 className="truncate text-sm sm:text-base font-medium text-gray-900">
                            {product.name || "Product"}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="rounded-none border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
                              Qty: {item.quantity}
                            </span>
                            {optionLabels.map((label) => (
                              <span
                                key={label}
                                className="rounded-none border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="self-center text-right">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                            Line total
                          </p>
                          <p className="text-sm sm:text-lg font-medium text-gray-900">
                            ${Number(item.lineTotal || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  <div className="border border-gray-200 p-3 rounded-none">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Subtotal
                    </p>
                    <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                      ${Number(order.subtotal || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="border border-gray-200 p-3 rounded-none">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Shipping
                    </p>
                    <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                      ${Number(order.shippingFee || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2 border border-gray-200 p-3 rounded-none sm:col-span-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Paid status
                    </p>
                    <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                      {order.isPaid ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
