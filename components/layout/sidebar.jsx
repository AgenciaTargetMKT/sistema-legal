"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    name: "Calendario",
    href: "/calendario",
    icon: Calendar,
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
  // En desktop XL: false (expandido), en desktop normal (lg-xl): true (minimizado)
  const [isMinimized, setIsMinimized] = useState(false);

  const displayInitial =
    empleado?.nombre?.[0] || empleado?.email?.[0]?.toUpperCase() || "U";

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  // Agregar clase al documento para ajustar el contenido
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isMinimized) {
        document.documentElement.classList.remove("sidebar-expanded");
      } else {
        document.documentElement.classList.add("sidebar-expanded");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("sidebar-expanded");
      }
    };
  }, [isMinimized]);

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out",
          // Móvil: overlay completo con ancho 64 (256px)
          "w-64",
          // Tablet (md-lg): minimizado automáticamente, ancho 20 (80px)
          "md:w-20",
          // Desktop grande (xl+): expandido si isMinimized=false, sino minimizado
          "xl:w-20",
          !isMinimized && "xl:w-64",
          // Posicionamiento y estilo
          "lg:m-4 lg:my-4 lg:ml-4 lg:mr-0 lg:h-[calc(100vh-2rem)] lg:rounded-2xl lg:shadow-xl",
          // Móvil: se oculta cuando isOpen=false
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl lg:rounded-2xl border border-gray-200/50 relative">
          {/* Logo y botón cerrar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex items-center h-20 border-b border-gray-100",
              // Móvil: siempre expandido con espacio entre
              "justify-between px-6",
              // Tablet (md-lg): minimizado (solo icono centrado)
              "md:justify-center md:px-2",
              // Desktop grande (xl+): depende de isMinimized
              !isMinimized && "xl:justify-between xl:px-6"
            )}
          >
            {/* Móvil: siempre muestra todo */}
            <div className="flex items-center space-x-3 md:hidden xl:hidden xl:group-[:not(.minimized)]:flex">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg"
              >
                <Scale className="h-6 w-6" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  Sistema Legal
                </h1>
                <p className="text-xs text-gray-500 font-medium truncate">
                  Gestión Legal
                </p>
              </div>
            </div>

            {/* Tablet y Desktop cuando está minimizado: solo icono */}
            <div className={cn("hidden md:block", !isMinimized && "xl:hidden")}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg"
              >
                <Scale className="h-6 w-6" />
              </motion.div>
            </div>

            {/* Desktop XL cuando NO está minimizado: muestra todo */}
            <div
              className={cn(
                "hidden",
                !isMinimized && "xl:flex xl:items-center xl:space-x-3"
              )}
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg"
              >
                <Scale className="h-6 w-6" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  Sistema Legal
                </h1>
                <p className="text-xs text-gray-500 font-medium truncate">
                  Gestión Legal
                </p>
              </div>
            </div>

            {/* Botón cerrar (solo móvil) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden hover:bg-gray-100 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Botón para minimizar/expandir (solo desktop XL+) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMinimized}
            className="hidden xl:flex absolute -right-3 top-16 z-10 h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
          >
            {isMinimized ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </motion.button>

          {/* Navigation */}
          <motion.nav
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "flex-1 py-4 space-y-1 overflow-y-auto",
              // Móvil: padding normal
              "px-3",
              // Tablet: padding reducido (minimizado)
              "md:px-1.5",
              // Desktop XL: depende de isMinimized
              !isMinimized && "xl:px-3"
            )}
            style={{ overflowX: "visible" }}
          >
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  whileHover={{ x: isMinimized ? 0 : 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative group"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    prefetch={false}
                    scroll={false}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full h-10 rounded-lg transition-all text-sm",
                        // Móvil: siempre con texto
                        "justify-start px-3",
                        // Tablet: centrado sin texto
                        "md:justify-center md:px-0",
                        // Desktop XL: depende de isMinimized
                        !isMinimized && "xl:justify-start xl:px-3",
                        isActive &&
                          "bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          "md:mr-0",
                          !isMinimized && "xl:mr-2"
                        )}
                      />
                      <span
                        className={cn(
                          "font-medium ml-2 truncate",
                          "md:hidden",
                          !isMinimized && "xl:inline"
                        )}
                      >
                        {item.name}
                      </span>
                    </Button>
                  </Link>

                  {/* Tooltip cuando está minimizado (tablet y desktop minimizado) */}
                  <div
                    className={cn(
                      "fixed left-20 md:left-22 lg:left-24 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap",
                      // Mostrar solo en tablet o desktop minimizado
                      "hidden md:block",
                      !isMinimized && "xl:hidden"
                    )}
                    style={{ top: "inherit", zIndex: 9999 }}
                  >
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
                  </div>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* User info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={cn(
              "border-t border-gray-100 bg-gray-50/50",
              // Móvil: padding normal
              "p-3",
              // Tablet: padding reducido
              "md:p-1.5",
              // Desktop XL: depende de isMinimized
              !isMinimized && "xl:p-3"
            )}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <Button
                variant="outline"
                className={cn(
                  "w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg font-medium text-sm shadow-sm justify-center",
                  // Tablet: centrado sin padding
                  "md:px-0",
                  // Desktop XL: depende de isMinimized
                  !isMinimized && "xl:px-3"
                )}
                onClick={onSignOut}
              >
                <LogOut
                  className={cn(
                    "h-4 w-4 shrink-0",
                    "md:mr-0",
                    !isMinimized && "xl:mr-2"
                  )}
                />
                <span
                  className={cn(
                    "ml-2 truncate text-xs",
                    "md:hidden",
                    !isMinimized && "xl:inline"
                  )}
                >
                  Cerrar Sesión
                </span>
              </Button>

              {/* Tooltip para botón de cerrar sesión cuando está minimizado */}
              <div
                className={cn(
                  "fixed left-20 md:left-22 lg:left-24 bottom-6 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap",
                  // Mostrar solo en tablet o desktop minimizado
                  "hidden md:block",
                  !isMinimized && "xl:hidden"
                )}
                style={{ zIndex: 9999 }}
              >
                Cerrar Sesión
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </aside>
    </>
  );
};

// Exportar con memo para evitar re-renders innecesarios
export const Sidebar = memo(SidebarComponent);
