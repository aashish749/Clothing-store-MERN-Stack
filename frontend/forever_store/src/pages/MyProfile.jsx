import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNotify } from "../hooks/useNotify";

const emptyAddressForm = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

const fieldClasses =
  "w-full rounded border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-black";

const MyProfile = () => {
  const notify = useNotify();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );
  const token = localStorage.getItem("token");

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyAddressForm);

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

  const loadAddresses = async () => {
    if (!token) {
      setAddresses([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${apiBaseUrl}/api/users/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(response.data?.addresses || []);
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Failed to load saved addresses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFormData(emptyAddressForm);
    setFormMode("add");
    setActiveAddressId(null);
  };

  const startEdit = (address) => {
    setFormMode("edit");
    setActiveAddressId(address._id);
    setFormData({
      label: address.label || "",
      fullName: address.fullName || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitAddress = async (event) => {
    event.preventDefault();

    if (!token) {
      notify.error("Please log in to manage your addresses.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        label: formData.label.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        line1: formData.line1.trim(),
        line2: formData.line2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        isDefault: formData.isDefault,
      };

      const response =
        formMode === "edit" && activeAddressId
          ? await axios.put(
              `${apiBaseUrl}/api/users/addresses/${activeAddressId}`,
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            )
          : await axios.post(`${apiBaseUrl}/api/users/addresses`, payload, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

      setAddresses(response.data?.addresses || []);
      notify.success(
        formMode === "edit" ? "Address updated." : "Address added.",
      );
      resetForm();
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Unable to save address right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!token) {
      notify.error("Please log in to manage your addresses.");
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this address? This cannot be undone.",
    );
    if (!shouldDelete) return;

    try {
      const response = await axios.delete(
        `${apiBaseUrl}/api/users/addresses/${addressId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data?.addresses || []);
      notify.success("Address deleted.");

      if (activeAddressId === addressId) {
        resetForm();
      }
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Unable to delete address.",
      );
    }
  };

  const handleSetDefault = async (addressId) => {
    if (!token) {
      notify.error("Please log in to manage your addresses.");
      return;
    }

    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/users/addresses/${addressId}/default`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data?.addresses || []);
      notify.success("Default address updated.");
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Unable to update default address.",
      );
    }
  };

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm h-fit lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                My Profile
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-medium text-gray-900">
                {user?.name || "Not available"}
              </h1>
              <p className="mt-2 text-sm text-gray-500 break-all">
                {user?.email || "Not available"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-700">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>

          <div className="mt-6 rounded-none bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Saved addresses
            </p>
            <p className="mt-1 text-2xl font-medium text-gray-900">
              {addresses.length}
            </p>
          </div>

          <div className="mt-4 text-sm text-gray-500 leading-6">
            Use this section to keep multiple shipping addresses and update them
            whenever you move or want a different delivery option.
          </div>

          {!token ? (
            <div className="mt-5 rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Please log in to add or update addresses.
              <div className="mt-3">
                <Link to="/login" className="font-medium underline">
                  Go to login
                </Link>
              </div>
            </div>
          ) : null}
        </aside>

        <main className="space-y-6">
          <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                  Address manager
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-medium text-gray-900">
                  {formMode === "edit" ? "Edit address" : "Add a new address"}
                </h2>
              </div>

              {formMode === "edit" ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="self-start sm:self-auto rounded-none border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <form onSubmit={submitAddress} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Label like Home or Work"
                />
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Phone number"
                  required
                />
                <input
                  name="line1"
                  value={formData.line1}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Address line 1"
                  required
                />
              </div>

              <input
                name="line2"
                value={formData.line2}
                onChange={handleChange}
                className={fieldClasses}
                placeholder="Address line 2 (optional)"
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="City"
                  required
                />
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="State"
                  required
                />
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Postal code"
                  required
                />
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={fieldClasses}
                  placeholder="Country"
                  required
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                Set as default address
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs sm:text-sm text-gray-500">
                  {formMode === "edit"
                    ? "Save changes to update the selected address."
                    : "Add more than one address and switch between them anytime."}
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {saving
                    ? formMode === "edit"
                      ? "Updating..."
                      : "Saving..."
                    : formMode === "edit"
                      ? "Update address"
                      : "Save address"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                  Saved addresses
                </p>
                <h2 className="mt-2 text-xl sm:text-2xl font-medium text-gray-900">
                  Delivery locations
                </h2>
              </div>
              {loading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              {addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                  No saved addresses yet. Add your first shipping address above.
                </div>
              ) : (
                addresses.map((address) => (
                  <article
                    key={address._id}
                    className={`rounded-none border p-4 sm:p-5 transition-colors duration-200 ${
                      address.isDefault
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {address.label || address.fullName}
                          </h3>
                          {address.isDefault ? (
                            <span className="rounded-none bg-black px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {address.fullName} · {address.phone}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-700">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                          <br />
                          {address.city}, {address.state} {address.postalCode}
                          <br />
                          {address.country}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {!address.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(address._id)}
                            className="rounded-none border border-gray-300 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                          >
                            Set default
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => startEdit(address)}
                          className="rounded-none border border-gray-300 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(address._id)}
                          className="rounded-none border border-red-200 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-red-600 hover:border-red-400 hover:text-red-700 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyProfile;
