import React, { useMemo } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  FiBarChart2,
  FiBox,
  FiHome,
  FiLogOut,
  FiImage,
  FiMenu,
  FiMessageSquare,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Theme from "./pages/Theme";
import Login from "./pages/Login";
import {
  clearAdminSession,
  isAdminAuthenticated,
  getStoredAdminUser,
} from "./lib/adminAuth";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: FiHome, end: true },
  { to: "/admin/products", label: "Products", icon: FiBox },
  { to: "/admin/categories", label: "Categories", icon: FiPackage },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/admin/users", label: "Users", icon: FiUsers },
  { to: "/admin/reviews", label: "Reviews", icon: FiMessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/admin/theme", label: "Theme", icon: FiImage },
  { to: "/admin/settings", label: "Settings", icon: FiSettings },
];

const stats = [
  { label: "Total Revenue", value: "$28.4k", note: "+12% this month" },
  { label: "Orders", value: "1,248", note: "94 pending" },
  { label: "Products", value: "326", note: "18 low stock" },
  { label: "Users", value: "4,810", note: "312 new this week" },
];

const recentOrders = [
  {
    id: "#10421",
    customer: "Aashish Chalaise",
    total: "$899",
    status: "Pending",
  },
  { id: "#10420", customer: "Nina Sharma", total: "$1,240", status: "Shipped" },
  { id: "#10419", customer: "Arjun Rai", total: "$499", status: "Delivered" },
];

const statusClasses = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Shipped: "bg-blue-50 text-blue-700 border-blue-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const AdminLayout = ({ children, onLogout }) => {
  const sidebarItems = useMemo(() => navItems, []);
  const storedUser = getStoredAdminUser();
  const displayName = storedUser?.name || storedUser?.email || "Admin";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <FiPackage className="text-lg" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Forever Store
              </p>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${isActive ? "bg-black text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                  }
                >
                  <Icon className="text-base" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Admin access
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage products, orders, users, and reviews from one place.
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white lg:hidden">
                  <FiMenu />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Admin Workspace
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Dashboard
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:block">
                  Search coming soon
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
};

const DashboardShell = () => (
  <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
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
              Overview
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Revenue trend
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Placeholder chart
          </span>
        </div>

        <div className="mt-5 flex h-64 items-end gap-3 rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
          {[42, 58, 36, 72, 64, 88, 76].map((height, index) => (
            <div key={index} className="flex flex-1 items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-3xl bg-black/85"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
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
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{order.id}</p>
                  <p className="text-sm text-slate-500">{order.customer}</p>
                </div>
                <p className="font-semibold text-slate-900">{order.total}</p>
              </div>
              <span
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[order.status]}`}
              >
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  </div>
);

const PagePlaceholder = ({ title, subtitle }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
      Coming soon
    </p>
    <h3 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h3>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
      {subtitle}
    </p>
  </div>
);

const App = () => {
  const handleLogout = () => {
    clearAdminSession();
    window.location.assign("/admin/login");
  };

  return (
    <BrowserRouter>
      <Toaster position="bottom-left" />
      <Routes>
        <Route
          path="/admin/login"
          element={
            isAdminAuthenticated() ? (
              <Navigate to="/admin" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Dashboard />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/products"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Products />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/categories"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Categories />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/orders"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Orders />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Users />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/reviews"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Reviews />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/analytics"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Analytics />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/settings"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Settings />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/admin/theme"
          element={
            isAdminAuthenticated() ? (
              <AdminLayout onLogout={handleLogout}>
                <Theme />
              </AdminLayout>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={isAdminAuthenticated() ? "/admin" : "/admin/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
