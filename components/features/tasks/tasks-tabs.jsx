"use client";

import { Button } from "@/components/ui/button";
import {
  User,
  Table,
  Calendar,
  AlertCircle,
  TrendingUp,
  Pause,
  CheckCircle2,
  Plus,
} from "lucide-react";

const tabs = [
  {
    id: "mis-tareas",
    label: "Mis Tareas",
    shortLabel: "Mías",
    icon: User,
  },
  { id: "todas", label: "Todas", shortLabel: "Todas", icon: Table },
  {
    id: "proximos-5-dias",
    label: "Hoy",
    shortLabel: "Hoy",
    icon: Calendar,
  },
  {
    id: "retrasadas",
    label: "Retrasadas",
    shortLabel: "Retrasadas",
    icon: AlertCircle,
    color: "text-red-500",
  },
  {
    id: "desempeno",
    label: "Desempeño Mensual",
    shortLabel: "Desempeño",
    icon: TrendingUp,
  },
  { id: "pausadas", label: "Pausadas", shortLabel: "Pausadas", icon: Pause },
  {
    id: "finalizadas",
    label: "Finalizadas",
    shortLabel: "Finalizadas",
    icon: CheckCircle2,
  },
];

export default function TareasTabs({
  vistaActual,
  onVistaChange,
  onNuevaTarea,
  tareasFiltradas = [],
}) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 rounded-t-xl">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          {/* Contenedor de tabs con scroll horizontal */}
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-1 bg-gray-200/90 dark:bg-gray-800 p-1 rounded-xl w-max min-w-full sm:min-w-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = vistaActual === tab.id;
                const showCount = tab.id === "mis-tareas" && isActive;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onVistaChange(tab.id)}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50"
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${tab.color || ""}`} />
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {showCount && (
                      <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                        {tareasFiltradas.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón nueva tarea */}
          <Button
            onClick={onNuevaTarea}
            className="bg-linear-to-br from-blue-500 to-blue-600 hover:bg-primary-700 text-white gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-md shadow-lg shadow-primary-600/20 transition-all hover:shadow-xl hover:shadow-primary-600/30 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Tarea</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
