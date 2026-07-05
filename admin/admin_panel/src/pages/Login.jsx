import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import adminApi from "../lib/adminApi";
import {
  isAdminAuthenticated,
  isAdminUser,
  setAdminSession,
} from "../lib/adminAuth";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }

    setLoading(true);

    try {
      const { data } = await adminApi.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const user = data.user || {};

      if (!isAdminUser(user)) {
        toast.error("This account is not an admin");
        return;
      }

      setAdminSession({ token: data.token, user });
      toast.success("Logged in successfully");
      // force a full reload so admin layout and data pick up the new session
      window.location.replace("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-2">
          <div className="flex flex-col justify-between bg-gradient-to-br from-black via-slate-900 to-slate-800 p-8 sm:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/50">
                Forever Store
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Admin Login
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                Sign in to manage products, orders, reviews, users, and sales
                data from one control panel.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-3 text-center text-xs text-white/60">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                Products
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                Orders
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                Analytics
              </div>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10 text-slate-900">
            <div className="mx-auto flex max-w-md flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Welcome back
              </p>
              <h2 className="mt-3 text-2xl font-semibold">Login to continue</h2>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Only users with admin access can continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
