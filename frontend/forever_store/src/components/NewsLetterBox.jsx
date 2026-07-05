import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const NewsLetterBox = () => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.post(`${apiBaseUrl}/api/newsletter/signup`, {
        email: email.trim(),
      });

      if (!response.data?.success) {
        setMessage("Could not subscribe. Please try again.");
        return;
      }

      setSubmitted(true);
      setEmail("");

      resetTimeoutRef.current = setTimeout(() => {
        setSubmitted(false);
      }, 3500);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to subscribe right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!submitted ? (
        <div className="section mb-5 mt-20 ">
          <hr className="text-gray-200 w-full pt-6" />
          <div className="container flex flex-col gap-3 justify-center items-center text-center">
            <h3 className="text-2xl font-medium">
              Subscribe now & get 20% off
            </h3>
            <p className="text-gray-500">
              Subscribe and be the first to know about exclusive deals, new
              arrivals, and special offers.
            </p>
            <form
              onSubmit={onSubmitHandler}
              className="flex items-stretch justify-center w-9/10"
            >
              <input
                type="email"
                className="px-4 py-2.5 border border-gray-300 w-full max-w-140"
                placeholder="Enter your Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                className="bg-black text-sm text-white px-4 py-2.5 h-auto hover:opacity-80"
                disabled={isSubmitting}
              >
                {isSubmitting ? "SUBSCRIBING..." : "SUBSCRIBE"}
              </button>
            </form>

            {message ? <p className="text-sm text-red-600">{message}</p> : null}
          </div>
          <hr className="text-gray-200 w-full mt-10" />
        </div>
      ) : (
        <div className="section mb-5 mt-20">
          <hr className="text-gray-200 w-full pt-6" />
          <div className="container flex flex-col gap-3 justify-center items-center text-center">
            <h3 className="text-2xl font-medium">
              Thank you for subscribing... <br />
            </h3>

            <h3 className="text-2xl font-medium">
              You will be notified when we have new offers and discounts. <br />
            </h3>
          </div>
          <hr className="text-gray-200 w-full mt-10" />
        </div>
      )}
    </>
  );
};

export default NewsLetterBox;
