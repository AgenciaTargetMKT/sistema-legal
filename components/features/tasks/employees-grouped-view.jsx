"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, User } from "lucide-react";
import { TasksTable } from "@/components/tables/tasks";

export default function EmployeesGroupedView({
  empleadosConTareas,
  tareasSinAsignar,
  empleadosExpandidos,
  onToggleEmpleado,
  getTareasPorEmpleado,
  onUpdate,
  onTareaClick,
}) {
  return (
    <div className="space-y-3 relative z-0">
      {/* Tareas sin asignar - Primero */}
      {tareasSinAsignar.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative z-0">
          <button
            onClick={() => onToggleEmpleado("sin-asignar")}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  rotate: empleadosExpandidos.has("sin-asignar") ? 90 : 0,
                }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </motion.div>
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Sin asignar
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tareasSinAsignar.length}{" "}
                  {tareasSinAsignar.length === 1 ? "tarea" : "tareas"} sin
                  responsable ni designado
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-full">
              {tareasSinAsignar.length}
            </span>
          </button>

          <AnimatePresence>
            {empleadosExpandidos.has("sin-asignar") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <TasksTable
                  tareas={tareasSinAsignar}
                  onUpdate={onUpdate}
                  onTareaClick={onTareaClick}
                  hideControls={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tareas por empleado */}
      {empleadosConTareas.map((emp) => {
        const tareasEmpleado = getTareasPorEmpleado(emp.id);
        const estaExpandido = empleadosExpandidos.has(emp.id);

        return (
          <div
            key={emp.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative z-0"
          >
            <button
              onClick={() => onToggleEmpleado(emp.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: estaExpandido ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </motion.div>
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {emp.nombre?.[0]}
                    {emp.apellido?.[0]}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {emp.nombre} {emp.apellido}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tareasEmpleado.length}{" "}
                    {tareasEmpleado.length === 1 ? "tarea" : "tareas"}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold rounded-full">
                {tareasEmpleado.length}
              </span>
            </button>

            <AnimatePresence>
              {estaExpandido && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <TasksTable
                    tareas={tareasEmpleado}
                    onUpdate={onUpdate}
                    onTareaClick={onTareaClick}
                    hideControls={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
