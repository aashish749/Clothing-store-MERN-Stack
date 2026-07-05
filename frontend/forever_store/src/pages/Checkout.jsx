import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ShopContext } from "../context";
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
  "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition-colors duration-200 focus:border-black";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const cardElementOptions = {
  style: {
    base: {
      color: "#111827",
      fontSize: "16px",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
  hidePostalCode: true,
};

const StripeCheckoutForm = ({
  apiBaseUrl,
  token,
  selectedAddress,
  selectedAddressId,
  fetchCart,
  navigate,
  notify,
  user,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState("");

  const handleStripePayment = async () => {
    if (!token) {
      notify.error("Please log in before placing an order.");
      return;
    }

    if (!selectedAddressId) {
      notify.error("Please select a delivery address first.");
      return;
    }

    if (!stripe || !elements) {
      notify.error("Stripe is still loading. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      notify.error("Please enter your card details.");
      return;
    }

    try {
      setProcessing(true);

      const orderResponse = await axios.post(
        `${apiBaseUrl}/api/orders`,
        {
          addressId: selectedAddressId,
          paymentMethod: "STRIPE",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const orderId = orderResponse.data?.order?._id;
      if (!orderId) {
        throw new Error(
          orderResponse.data?.message || "Unable to create order.",
        );
      }

      const intentResponse = await axios.post(
        `${apiBaseUrl}/api/payments/create-intent`,
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const clientSecret = intentResponse.data?.clientSecret;
      if (!clientSecret) {
        throw new Error("Unable to initialize Stripe payment.");
      }

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: selectedAddress?.fullName || user?.name || "",
            email: user?.email || "",
          },
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || "Payment failed.");
      }

      if (confirmResult.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not successful.");
      }

      await axios.post(
        `${apiBaseUrl}/api/payments/confirm`,
        {
          paymentIntentId: confirmResult.paymentIntent.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      notify.success("Order placed and payment successful.");
      await fetchCart();
      navigate("/orders");
    } catch (error) {
      notify.error(
        error?.response?.data?.message || error?.message || "Payment failed.",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="mt-4 rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Stripe publishable key is missing. Please add
        <span className="font-medium"> VITE_STRIPE_PUBLISHABLE_KEY</span> to
        the frontend env.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-none border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <p className="text-sm text-gray-600">Enter your card details below.</p>
      <div className="mt-3 rounded-none border border-gray-200 bg-white px-3 py-3">
        <CardElement
          options={cardElementOptions}
          onChange={(event) => {
            setCardComplete(event.complete);
            setCardError(event.error?.message || "");
          }}
        />
      </div>
      {cardError ? (
        <p className="mt-2 text-sm text-red-600">{cardError}</p>
      ) : null}
      <div className="w-full text-end mt-8">
        <button
          type="button"
          onClick={handleStripePayment}
          disabled={processing || !cardComplete}
          className="bg-black text-white px-10 sm:px-16 py-3 text-sm active:bg-gray-700 uppercase disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};

const Checkout = () => {
  const notify = useNotify();
  const navigate = useNavigate();
  const [method, setMethod] = useState("cod");
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  const { currency, cartTotal, cartShippingFee, fetchCart } =
    useContext(ShopContext);
  const token = localStorage.getItem("token");
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

  const selectedAddress = useMemo(
    () =>
      addresses.find((address) => address._id === selectedAddressId) || null,
    [addresses, selectedAddressId],
  );

  const loadAddresses = async () => {
    if (!token) {
      setAddresses([]);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await axios.get(`${apiBaseUrl}/api/users/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const savedAddresses = response.data?.addresses || [];
      setAddresses(savedAddresses);

      const defaultAddress = savedAddresses.find(
        (address) => address.isDefault,
      );
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      } else if (savedAddresses[0]?._id) {
        setSelectedAddressId(savedAddresses[0]._id);
      }
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Failed to load saved addresses.",
      );
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitAddress = async (event) => {
    event.preventDefault();

    if (!token) {
      notify.error("Please log in to save an address.");
      return;
    }

    try {
      setSavingAddress(true);
      const payload = {
        label: addressForm.label.trim(),
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        country: addressForm.country.trim(),
        isDefault: addressForm.isDefault,
      };

      const response = await axios.post(
        `${apiBaseUrl}/api/users/addresses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const savedAddresses = response.data?.addresses || [];
      setAddresses(savedAddresses);
      setShowNewAddressForm(false);
      setAddressForm(emptyAddressForm);
      notify.success("Address saved.");

      const newDefault = savedAddresses.find((address) => address.isDefault);
      if (newDefault) {
        setSelectedAddressId(newDefault._id);
      } else if (savedAddresses[savedAddresses.length - 1]?._id) {
        setSelectedAddressId(savedAddresses[savedAddresses.length - 1]._id);
      }
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Unable to save address right now.",
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCodPlaceOrder = async () => {
    if (!token) {
      notify.error("Please log in before placing an order.");
      return;
    }

    if (!selectedAddressId) {
      notify.error("Please select a delivery address first.");
      return;
    }

    try {
      setPlacingOrder(true);
      const response = await axios.post(
        `${apiBaseUrl}/api/orders`,
        {
          addressId: selectedAddressId,
          paymentMethod: "COD",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data?.success) {
        notify.success("Order placed successfully.");
        await fetchCart();
        navigate("/orders");
        return;
      }

      notify.error(response.data?.message || "Order was not successful.");
    } catch (error) {
      notify.error(
        error?.response?.data?.message || "Order was not successful.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const total = Number(cartTotal || 0) + Number(cartShippingFee || 0);

  return (
    <div className="container pt-5 sm:pt-14 min-h-[60vh] border-t border-gray-300">
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <div className="space-y-6">
          <div className="text-lg sm:text-xl lg:text-[22px]">
            <Title text1={"DELIVERY"} text2={"INFORMATION"} />
          </div>

          {!token ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You need to log in before you can use saved addresses.
              <div className="mt-3">
                <Link to="/login" className="font-medium underline">
                  Go to login
                </Link>
              </div>
            </div>
          ) : null}

          <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                  Saved address
                </p>
                <h3 className="mt-2 text-lg sm:text-xl font-medium text-gray-900 leading-tight">
                  {loadingAddresses
                    ? "Loading addresses..."
                    : selectedAddress
                      ? selectedAddress.label || selectedAddress.fullName
                      : "No address selected"}
                </h3>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                onClick={() => setShowNewAddressForm((current) => !current)}
                disabled={!token}
              >
                {showNewAddressForm ? "Cancel new address" : "Add new address"}
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <label
                    key={address._id}
                    className={`flex cursor-pointer items-start gap-3 rounded-none border p-4 transition-colors duration-200 ${selectedAddressId === address._id ? "border-black bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400"}`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === address._id}
                      onChange={() => setSelectedAddressId(address._id)}
                      className="mt-1 h-4 w-4 accent-black"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {address.label || address.fullName}
                        </p>
                        {address.isDefault ? (
                          <span className="rounded-full bg-black px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {address.fullName} · {address.phone}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-700">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} {address.postalCode}
                        <br />
                        {address.country}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <div className="rounded-none border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                  No saved addresses yet. Use the button above to add one
                  directly here.
                </div>
              )}
            </div>
          </section>

          {showNewAddressForm ? (
            <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                    New address
                  </p>
                  <h3 className="mt-2 text-lg sm:text-xl font-medium text-gray-900 leading-tight">
                    Add a shipping address
                  </h3>
                </div>
              </div>

              <form onSubmit={submitAddress} className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="label"
                    value={addressForm.label}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Label like Home or Work"
                  />
                  <input
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Phone number"
                    required
                  />
                  <input
                    name="line1"
                    value={addressForm.line1}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Address line 1"
                    required
                  />
                </div>

                <input
                  name="line2"
                  value={addressForm.line2}
                  onChange={handleAddressFieldChange}
                  className={fieldClasses}
                  placeholder="Address line 2 (optional)"
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="City"
                    required
                  />
                  <input
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="State"
                    required
                  />
                  <input
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Postal code"
                    required
                  />
                  <input
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressFieldChange}
                    className={fieldClasses}
                    placeholder="Country"
                    required
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    name="isDefault"
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={handleAddressFieldChange}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  Set as default address
                </label>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(false);
                      setAddressForm(emptyAddressForm);
                    }}
                    className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {savingAddress ? "Saving..." : "Save address"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>

        <div className="space-y-6 lg:pt-[76px]">
          <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="text-lg sm:text-xl lg:text-[22px]">
              <Title text1={"CART"} text2={"TOTALS"} />
            </div>
            <div className="flex flex-col gap-2 mt-3 text-sm">
              <div className="flex justify-between gap-4">
                <p>Subtotal</p>
                <p>
                  {currency} {Number(cartTotal || 0).toFixed(2)}
                </p>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between gap-4">
                <p>Shipping Fee</p>
                <p>
                  {currency} {Number(cartShippingFee || 0).toFixed(2)}
                </p>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between gap-4 text-base font-medium">
                <b>Total</b>
                <b>
                  {currency} {total.toFixed(2)}
                </b>
              </div>
            </div>
          </section>

          <section className="rounded-none border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="text-lg sm:text-xl lg:text-[22px]">
              <Title text1={"PAYMENT"} text2={"METHOD"} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("stripe")}
                className={`flex min-h-14 items-center gap-3 rounded-none border p-3 text-left transition-colors duration-200 ${method === "stripe" ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-500"}`}
              >
                <span
                  className={`min-w-3.5 h-3.5 border rounded-full ${method === "stripe" ? "bg-green-400" : ""}`}
                />
                <img
                  className="h-5 mx-1"
                  src={assets.stripe_logo}
                  alt="Stripe"
                />
              </button>

              <button
                type="button"
                onClick={() => setMethod("cod")}
                className={`flex min-h-14 items-center gap-3 rounded-none border p-3 text-left transition-colors duration-200 ${method === "cod" ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-500"}`}
              >
                <span
                  className={`min-w-3.5 h-3.5 border rounded-full ${method === "cod" ? "bg-green-400" : ""}`}
                />
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Cash on delivery
                </p>
              </button>
            </div>

            {method === "cod" ? (
              <div className="w-full text-end mt-8">
                <button
                  type="button"
                  onClick={handleCodPlaceOrder}
                  disabled={placingOrder}
                  className="bg-black text-white px-10 sm:px-16 py-3 text-sm active:bg-gray-700 uppercase disabled:cursor-not-allowed disabled:bg-gray-500"
                >
                  {placingOrder ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            ) : (
              <Elements stripe={stripePromise}>
                <StripeCheckoutForm
                  apiBaseUrl={apiBaseUrl}
                  token={token}
                  selectedAddress={selectedAddress}
                  selectedAddressId={selectedAddressId}
                  fetchCart={fetchCart}
                  navigate={navigate}
                  notify={notify}
                  user={user}
                />
              </Elements>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
