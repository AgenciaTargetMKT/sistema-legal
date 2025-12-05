"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 3000,
        style: {
          background: "rgb(31 41 55)", // gray-800
          color: "#fff",
          borderRadius: "12px",
          padding: "14px 18px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgb(55 65 81)", // gray-700
        },
        success: {
          duration: 3000,
          style: {
            background: "rgb(20 83 45)", // green-900
            border: "1px solid rgb(34 197 94)", // green-500
          },
          iconTheme: {
            primary: "#22c55e", // green-500
            secondary: "#fff",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: "rgb(127 29 29)", // red-900
            border: "1px solid rgb(239 68 68)", // red-500
          },
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#fff",
          },
        },
        loading: {
          style: {
            background: "rgb(30 58 138)", // blue-900
            border: "1px solid rgb(59 130 246)", // blue-500
          },
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
