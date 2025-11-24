"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al home (dashboard principal)
    router.push("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
          <span className="text-2xl">⚖️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema Legal</h1>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
