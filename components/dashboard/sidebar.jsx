"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Scale,
  Users,
  UserCog,
  CheckSquare,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Procesos",
    href: "/procesos",
    icon: Scale,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
  },

  {
    name: "Tareas",
    href: "/tareas",
    icon: CheckSquare,
  },
  {
    name: "Impulsos",
    href: "/impulsos",
    icon: Bell,
  },
  {
    name: "Empleados",
    href: "/empleados",
    icon: UserCog,
  },
];

const SidebarComponent = ({ empleado, onSignOut, isOpen, onClose }) => {
  const pathname = usePathname();

  const displayName = empleado
    ? `${empleado.nombre} ${empleado.apellido}`
    : "Usuario";
  const displayRole = empleado?.rol?.nombre || "Cargando...";
  const displayInitial =
    empleado?.nombre?.[0] || empleado?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:m-4 lg:my-4 lg:ml-4 lg:mr-0 lg:h-[calc(100vh-2rem)] lg:rounded-xl lg:shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-white/80 backdrop-blur-md lg:rounded-xl border">
          {/* Logo y botón cerrar */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sistema Legal</h1>
                <p className="text-xs text-muted-foreground">Gestión Legal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  prefetch={false}
                  scroll={false}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive &&
                        "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {displayInitial}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayRole}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

// Exportar con memo para evitar re-renders innecesarios
export const Sidebar = memo(SidebarComponent);
