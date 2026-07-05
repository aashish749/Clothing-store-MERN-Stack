import React, { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiMapPin,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

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

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

const Users = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersResponse, ordersResponse] = await Promise.all([
        adminApi.get("/api/users/admin/users", {
          headers: getAdminAuthHeaders(),
        }),
        adminApi.get("/api/orders/admin/all", {
          headers: getAdminAuthHeaders(),
        }),
      ]);

      setUsers(usersResponse.data.users || []);
      setOrders(ordersResponse.data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return users;

    return users.filter((user) =>
      [user.name, user.email].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }, [users, query]);

  const selectedUserOrders = useMemo(() => {
    if (!selectedUser?._id) return [];
    return orders.filter(
      (order) =>
        String(order.userId?._id || order.userId) === String(selectedUser._id),
    );
  }, [orders, selectedUser]);

  const selectedUserStats = useMemo(() => {
    const totalOrders = selectedUserOrders.length;
    const totalSpent = selectedUserOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice || 0),
      0,
    );
    const lastOrder = selectedUserOrders[0] || null;
    const defaultAddress =
      selectedUser?.addresses?.find((address) => address.isDefault) ||
      selectedUser?.addresses?.[0] ||
      null;

    return { totalOrders, totalSpent, lastOrder, defaultAddress };
  }, [selectedUser, selectedUserOrders]);

  const metrics = useMemo(
    () => [
      { label: "Users", value: users.length },
      { label: "Admins", value: users.filter((user) => user.isAdmin).length },
      {
        label: "With addresses",
        value: users.filter((user) => (user.addresses || []).length > 0).length,
      },
      { label: "Showing", value: filteredUsers.length },
    ],
    [users, filteredUsers],
  );

  const openUser = (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setDetailLoading(false);
  };

  const closeDetail = () => {
    if (deleting) return;
    setDetailOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedUser.name}? This will remove the account and unlink their orders.`,
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await adminApi.delete(`/api/users/admin/${selectedUser._id}`, {
        headers: getAdminAuthHeaders(),
      });

      toast.success("User deleted");
      setUsers((current) =>
        current.filter((user) => user._id !== selectedUser._id),
      );
      setOrders((current) =>
        current.filter(
          (order) =>
            String(order.userId?._id || order.userId) !==
            String(selectedUser._id),
        ),
      );
      closeDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Users
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Customer list
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

        <div className="mt-5">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FiSearch className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-12 text-center text-slate-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Addresses</th>
                  <th className="px-5 py-4 font-medium">Joined</th>
                  <th className="px-5 py-4 font-medium">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{user.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {user.isAdmin ? "Admin" : "Customer"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {(user.addresses || []).length}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openUser(user)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Open
                        <FiArrowRight />
                      </button>
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
          <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  User profile
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedUser?.name || "Loading..."}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">
                {detailLoading ? (
                  <div className="py-16 text-center text-slate-500">
                    Loading profile...
                  </div>
                ) : selectedUser ? (
                  <div className="space-y-5">
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Orders",
                          value: selectedUserStats.totalOrders,
                        },
                        {
                          label: "Spent",
                          value: formatMoney(selectedUserStats.totalSpent),
                        },
                        {
                          label: "Addresses",
                          value: (selectedUser.addresses || []).length,
                        },
                        {
                          label: "Joined",
                          value: formatDate(selectedUser.createdAt),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Account
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">
                            Name:{" "}
                          </span>
                          {selectedUser.name}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">
                            Email:{" "}
                          </span>
                          {selectedUser.email}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">
                            Role:{" "}
                          </span>
                          {selectedUser.isAdmin ? "Admin" : "Customer"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">
                            Joined:{" "}
                          </span>
                          {formatDateTime(selectedUser.createdAt)}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-900">
                        <FiMapPin className="text-slate-400" />
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          Locations
                        </p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(selectedUser.addresses || []).length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                            No saved locations.
                          </div>
                        ) : (
                          (selectedUser.addresses || []).map((address) => (
                            <div
                              key={address._id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-slate-900">
                                  {address.label || address.fullName}
                                </p>
                                {address.isDefault ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm text-slate-600">
                                {address.fullName}
                              </p>
                              <p className="text-sm text-slate-600">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ""}
                              </p>
                              <p className="text-sm text-slate-600">
                                {address.city}, {address.state},{" "}
                                {address.postalCode}
                              </p>
                              <p className="text-sm text-slate-600">
                                {address.country} · {address.phone}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Order history
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedUserOrders.length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                            No orders found for this user.
                          </div>
                        ) : (
                          selectedUserOrders.map((order) => (
                            <div
                              key={order._id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    #{order._id?.slice(-8)?.toUpperCase()}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {formatDateTime(order.createdAt)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {order.orderStatus} ·{" "}
                                    {order.isPaid ? "Paid" : "Unpaid"} ·{" "}
                                    {order.paymentMethod}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-slate-900">
                                    {formatMoney(order.totalPrice)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {order.items?.length || 0} items
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Actions
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Manage user
                </h3>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={deleting || !selectedUser}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 />
                    {deleting ? "Deleting..." : "Delete user"}
                  </button>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Close
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

export default Users;
