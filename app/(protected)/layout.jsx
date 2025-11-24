"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Usar selectores específicos para evitar re-renders
  const user = useAuthStore((state) => state.user);
  const empleado = useAuthStore((state) => state.empleado);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const initialize = useAuthStore((state) => state.initialize);
  const signOut = useAuthStore((state) => state.signOut);

  // Inicializar SOLO si no está inicializado
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Verificar autenticación después de inicializar
  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push("/login");
    }
  }, [initialized, loading, user, router]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.href = "/login";
  }, [signOut]);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Mostrar cargando solo si estamos verificando la sesión inicial
  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Sidebar Component */}
      <Sidebar
        empleado={empleado}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Component */}
        <Header onMenuClick={handleMenuClick} empleado={empleado} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
