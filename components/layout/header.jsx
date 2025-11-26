"use client";

import { memo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Bell, Search, Calendar } from "lucide-react";
import { CalendarPopover } from "../features/calendario/calendar-popover";
import { motion, AnimatePresence } from "framer-motion";

const HeaderComponent = ({ onMenuClick, empleado }) => {
  const pathname = usePathname();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
      className="sticky top-0 z-30 p-4 md:px-6"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex h-16 items-center gap-4 rounded-2xl bg-white shadow-sm border border-gray-200 px-4 md:px-6"
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
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
            {currentPage.title}
          </h1>
          {currentPage.description && (
            <p className="text-xs md:text-sm text-gray-500 truncate hidden md:block">
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
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl relative"
        >
          <div className="flex items-center gap-2">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4, type: "spring" }}
                className="text-2xl font-bold text-gray-900"
              >
                {dayOfMonth}
              </motion.div>
            </div>
            <div className="text-left border-l pl-2 border-gray-300">
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="text-xs text-gray-600 capitalize"
              >
                {dayOfWeek}.
              </motion.div>
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-xs text-gray-600 capitalize"
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
              <Calendar className="h-5 w-5 text-gray-600" />
            </Button>
          </motion.div>
        </motion.div>
        {/* Avatar del usuario */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ y: -2 }}
          className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200"
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
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
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
