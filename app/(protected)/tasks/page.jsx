"use client";

import { motion, AnimatePresence } from "framer-motion";
import useTasksPage from "@/hooks/use-tasks-page";
import { TasksTable, TaskPanel } from "@/components/tables/tasks";
import {
  MonthlyPerformanceView,
  EmptyState,
  TasksTabs,
  TasksFilters,
  EmployeesGroupedView,
} from "@/components/features/tasks";
import { CheckSquare, User, Pause, CheckCircle2 } from "lucide-react";

export default function TasksPage() {
  const {
    // Datos
    tareas,
    tareasFiltradas,
    estadosTarea,
    loading,
    empleadoListo,

    // Estados de filtros
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroImportancia,
    setFiltroImportancia,
    filtroUrgencia,
    setFiltroUrgencia,

    // Estados de UI
    vistaActual,
    setVistaActual,
    panelOpen,
    tareaSeleccionada,
    empleadosExpandidos,
    openEstado,
    setOpenEstado,
    mostrarFiltros,

    // Handlers
    handleNuevaTarea,
    handleEditarTarea,
    handleClosePanel,
    toggleEmpleado,
    refetch,

    // Funciones helper
    getTareasPorEmpleado,
    getTareasSinAsignar,
    getEmpleadosConTareas,
  } = useTasksPage();

  return (
    <div className="min-h-full">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header con tabs */}
        <TasksTabs
          vistaActual={vistaActual}
          onVistaChange={setVistaActual}
          onNuevaTarea={handleNuevaTarea}
          tareasFiltradas={tareasFiltradas}
        />

        {/* Barra de filtros */}
        {mostrarFiltros && (
          <TasksFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filtroEstado={filtroEstado}
            onEstadoChange={setFiltroEstado}
            filtroImportancia={filtroImportancia}
            onImportanciaChange={setFiltroImportancia}
            filtroUrgencia={filtroUrgencia}
            onUrgenciaChange={setFiltroUrgencia}
            estadosTarea={estadosTarea}
            openEstado={openEstado}
            onOpenEstadoChange={setOpenEstado}
            totalTareas={tareasFiltradas.length}
          />
        )}

        {/* Contenido principal */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading || (vistaActual === "mis-tareas" && !empleadoListo) ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cargando tareas...
                  </p>
                </div>
              </motion.div>
            ) : vistaActual === "desempeno" ? (
              <motion.div
                key="desempeno"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <MonthlyPerformanceView />
              </motion.div>
            ) : vistaActual === "pausadas" ? (
              <motion.div
                key="pausadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.filter((t) =>
                  t.estado?.nombre?.toLowerCase().includes("pausa")
                ).length === 0 ? (
                  <EmptyState
                    icon={Pause}
                    title="No hay tareas pausadas"
                    description="Las tareas en pausa aparecerán aquí"
                    color="yellow"
                  />
                ) : (
                  <TasksTable
                    tareas={tareasFiltradas.filter((t) =>
                      t.estado?.nombre?.toLowerCase().includes("pausa")
                    )}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "finalizadas" ? (
              <motion.div
                key="finalizadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareas.filter((t) => t.estado?.categoria === "completado")
                  .length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No hay tareas finalizadas"
                    description="Las tareas completadas aparecerán aquí"
                    color="green"
                  />
                ) : (
                  <TasksTable
                    tareas={tareas.filter(
                      (t) => t.estado?.categoria === "completado"
                    )}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "mis-tareas" ? (
              <motion.div
                key="mis-tareas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="No tienes tareas asignadas"
                    description={
                      searchTerm
                        ? "No se encontraron tareas"
                        : "Las tareas donde eres responsable o designado aparecerán aquí"
                    }
                    color="blue"
                  />
                ) : (
                  <TasksTable
                    tareas={tareasFiltradas}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "retrasadas" ? (
              <motion.div
                key="retrasadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="¡No hay tareas retrasadas!"
                    description="Todas las tareas están al día"
                    color="green"
                  />
                ) : (
                  <TasksTable
                    tareas={tareasFiltradas}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "todas" || vistaActual === "proximos-5-dias" ? (
              <motion.div
                key={vistaActual}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {getEmpleadosConTareas().length === 0 &&
                getTareasSinAsignar().length === 0 ? (
                  <EmptyState
                    icon={User}
                    title="No hay tareas"
                    description={
                      searchTerm
                        ? "No se encontraron tareas"
                        : "Las tareas aparecerán organizadas por empleado"
                    }
                    color="gray"
                  />
                ) : (
                  <EmployeesGroupedView
                    empleadosConTareas={getEmpleadosConTareas()}
                    tareasSinAsignar={getTareasSinAsignar()}
                    empleadosExpandidos={empleadosExpandidos}
                    onToggleEmpleado={toggleEmpleado}
                    getTareasPorEmpleado={getTareasPorEmpleado}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <TaskPanel
        key={
          panelOpen ? tareaSeleccionada?.id || `new-${Date.now()}` : "closed"
        }
        tarea={tareaSeleccionada}
        isOpen={panelOpen}
        onClose={handleClosePanel}
        onUpdate={refetch}
      />
    </div>
  );
}
