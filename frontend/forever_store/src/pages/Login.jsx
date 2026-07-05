import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setIsRedirecting(false);
    setMessage("");
    setMessageType("info");

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        email,
        password,
      });

      const data = response.data;

      if (!data.success) {
        setMessage(data.message || "Login failed. Please try again.");
        setMessageType("error");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage("Login successful.");
      setMessageType("success");
      setIsRedirecting(true);

      redirectTimeoutRef.current = setTimeout(() => {
        navigate("/");
      }, 900);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to login right now. Please try again.",
      );
      setMessageType("error");
      setIsRedirecting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <hr className="container bg-gray-200 text-gray-300 mb-8 h-[ 2px]" />
      <div className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-20 gap-4 text-gray-800">
        {/* Heading Container */}
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-3xl">Login</p>
          <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
        </div>

        {/* Form Container */}
        <form onSubmit={onSubmitHandler} className="w-full flex flex-col gap-4">
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting || isRedirecting}
            required
          />

          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting || isRedirecting}
            required
          />

          {message ? (
            <p
              className={`text-sm text-center ${messageType === "error" ? "text-red-600" : messageType === "success" ? "text-green-700" : "text-gray-700"}`}
            >
              {message}
            </p>
          ) : null}

          {/* Links Section */}
          <div className="w-full flex justify-between text-sm mt-[-8px]">
            <p className="cursor-pointer">Forgot your password?</p>
            <Link to="/signup">
              <p className="cursor-pointer">Create account</p>
            </Link>
          </div>

          {/* Action Button */}
          <button
            className="bg-black text-white font-light px-8 py-2 mt-4 min-w-36 w-fit m-auto flex items-center justify-center gap-2"
            disabled={isSubmitting || isRedirecting}
          >
            {isSubmitting || isRedirecting ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : null}
            {isRedirecting
              ? "Redirecting..."
              : isSubmitting
                ? "Signing in..."
                : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
