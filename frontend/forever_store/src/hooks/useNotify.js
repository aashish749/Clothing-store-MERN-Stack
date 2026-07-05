import toast from "react-hot-toast";

const baseStyle = {
  border: "1px solid #e5e7eb",
  padding: "12px 14px",
  color: "#111827",
  background: "#ffffff",
  boxShadow: "0 8px 20px rgba(17, 24, 39, 0.08)",
};

export const useNotify = () => {
  const success = (message) =>
    toast.success(message, {
      style: {
        ...baseStyle,
        border: "1px solid #bbf7d0",
      },
      iconTheme: {
        primary: "#16a34a",
        secondary: "#ecfdf5",
      },
    });

  const error = (message) =>
    toast.error(message, {
      style: {
        ...baseStyle,
        border: "1px solid #fecaca",
      },
      iconTheme: {
        primary: "#dc2626",
        secondary: "#fef2f2",
      },
    });

  const info = (message) =>
    toast(message, {
      style: baseStyle,
      icon: "i",
    });

  return {
    success,
    error,
    info,
  };
};
