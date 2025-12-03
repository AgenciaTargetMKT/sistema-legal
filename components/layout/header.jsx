"use client";

import { memo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Bell, Search, Calendar, Moon, Sun } from "lucide-react";
import { CalendarPopover } from "../features/calendario/calendar-popover";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";

const HeaderComponent = ({ onMenuClick, empleado }) => {
  const pathname = usePathname();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const displayName = empleado
    ? `${empleado.nombre} ${empleado.apellido}`
    : "Usuario";

  const displayInitial =
    empleado?.nombre?.[0] || empleado?.email?.[0]?.toUpperCase() || "U";

  // Obtener fecha actual
  const now = new Date();
  const dayOfMonth = now.getDate();
  const dayOfWeek = now.toLocaleDateString("es-ES", { weekday: "short" });
  const month = now.toLocaleDateString("es-ES", { month: "long" });

  // Obtener título y descripción según la página actual
  const pageInfo = {
    "/dashboard": {
      title: "Dashboard",
      description: "Resumen general del sistema",
    },
    "/calendario": {
      title: "Calendario",
      description: "Gestiona tus eventos y citas",
    },
    "/procesos": {
      title: "Procesos",
      description: "Gestiona los procesos legales",
    },
    "/clientes": {
      title: "Clientes",
      description: "Administra tu cartera de clientes",
    },
    "/tareas": {
      title: "Tareas",
      description: "Gestiona las tareas de tus procesos legales",
    },
    "/impulsos": {
      title: "Impulsos",
      description: "Seguimiento de impulsos procesales",
    },
    "/empleados": {
      title: "Empleados",
      description: "Gestiona el equipo de trabajo",
    },
    "/catalogos": {
      title: "Catálogos",
      description: "Administra los catálogos del sistema",
    },
  };

  const currentPage = pageInfo[pathname] || {
    title: "Sistema Legal",
    description: "",
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 pt-4 px-4 md:px-6"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex h-16 items-center gap-4 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 px-4 md:px-6"
      >
        {/* Botón menú móvil - PRIMERO A LA IZQUIERDA */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Título de la página */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {currentPage.title}
          </h1>
          {currentPage.description && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate hidden md:block">
              {currentPage.description}
            </p>
          )}
        </motion.div>
        {/* Barra de búsqueda
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full max-w-xs"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white rounded-lg"
            />
          </div>
        </motion.div>
        */}
        {/* Notificaciones 
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button variant="ghost" size="icon" className="relative rounded-lg">
            <Bell className="h-5 w-5 text-gray-600" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5, type: "spring" }}
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"
            />
          </Button>
        </motion.div>
        */}
        {/* Fecha y Calendario */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          whileHover={{ scale: 1.02 }}
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl relative"
        >
          <div className="flex items-center gap-2">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4, type: "spring" }}
                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                {dayOfMonth}
              </motion.div>
            </div>
            <div className="text-left border-l pl-2 border-gray-300 dark:border-gray-600">
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="text-xs text-gray-600 dark:text-gray-300 capitalize"
              >
                {dayOfWeek}.
              </motion.div>
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-xs text-gray-600 dark:text-gray-300 capitalize"
              >
                {month}
              </motion.div>
            </div>
          </div>
          <motion.div whileHover={{ rotate: 15 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Botón de cambio de tema */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "light" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Avatar del usuario */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -2 }}
          className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.5,
              type: "spring",
              bounce: 0.5,
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"
          >
            {displayInitial}
          </motion.div>
          <motion.div
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="text-left"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {empleado?.rol?.nombre || "Usuario"}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Calendar Popover */}
      <AnimatePresence>
        {isCalendarOpen && (
          <CalendarPopover
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
};

// Exportar con memo para evitar re-renders innecesarios
export const Header = memo(HeaderComponent);
