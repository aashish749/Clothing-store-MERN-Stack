import React, { useEffect, useState } from "react";
import { FiRefreshCw, FiTruck } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../lib/adminApi";

const Settings = () => {
  const [fee, setFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadShipping = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/shipping");
      const shipping = data.shipping || {};
      setFee(Number(shipping.fee || 0));
      setFreeShippingThreshold(Number(shipping.freeShippingThreshold || 0));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load shipping");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipping();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await adminApi.put(
        "/api/shipping",
        {
          fee: Number(fee || 0),
          freeShippingThreshold: Number(freeShippingThreshold || 0),
        },
        {
          headers: getAdminAuthHeaders(),
        },
      );
      toast.success("Shipping settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save shipping");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Shipping settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Update shipping fee and free-shipping threshold.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Shipping fee", value: `$${Number(fee || 0).toFixed(2)}` },
            {
              label: "Free threshold",
              value: `$${Number(freeShippingThreshold || 0).toFixed(2)}`,
            },
            { label: "Status", value: loading ? "Loading" : "Ready" },
            { label: "Section", value: "Checkout" },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <form
        onSubmit={handleSave}
        className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <FiTruck />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Shipping
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Fee controls
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Shipping fee
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Free shipping threshold
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(event) =>
                  setFreeShippingThreshold(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className={saving ? "animate-spin" : ""} />
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={loadShipping}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Reload
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Tip
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Keep checkout simple
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Set the fee low enough to stay competitive, then use the threshold
            to reward bigger carts with free shipping.
          </p>
        </section>
      </form>
    </div>
  );
};

export default Settings;
