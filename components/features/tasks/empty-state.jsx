"use client";

import { motion } from "framer-motion";

const colorVariants = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  yellow: "from-yellow-400 to-orange-500",
  gray: "from-gray-400 to-gray-500",
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  color = "gray",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className={`w-16 h-16 rounded-2xl bg-linear-to-br ${colorVariants[color]} flex items-center justify-center mb-5 shadow-lg`}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {description}
      </p>
    </div>
  );
}
