"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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

  const displayInitial =
    empleado?.nombre?.[0] || empleado?.email?.[0]?.toUpperCase() || "U";

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
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:m-4 lg:my-4 lg:ml-4 lg:mr-0 lg:h-[calc(100vh-2rem)] lg:rounded-2xl lg:shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl lg:rounded-2xl border border-gray-200/50">
          {/* Logo y botón cerrar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between h-20 px-6 border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg"
              >
                <Scale className="h-6 w-6" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Sistema Legal
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Gestión Legal
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden hover:bg-gray-100 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Navigation */}
          <motion.nav
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
          >
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
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
                        "w-full justify-start h-12 px-4 rounded-xl transition-all text-base",
                        isActive &&
                          "bg-linear-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* User info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-5 border-t border-gray-100 bg-gray-50/50"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full justify-center h-12 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl font-medium text-base shadow-sm"
                onClick={onSignOut}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Cerrar Sesión
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </aside>
    </>
  );
};

// Exportar con memo para evitar re-renders innecesarios
export const Sidebar = memo(SidebarComponent);
