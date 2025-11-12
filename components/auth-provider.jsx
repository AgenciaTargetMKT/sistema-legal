"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export function AuthProvider({ children }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar

  return <>{children}</>;
}
