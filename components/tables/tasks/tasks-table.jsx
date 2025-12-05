"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import clsx from "clsx";
import { ColumnHeader } from "../shared";
import { SortableRow } from "./table-cells";
import { useTasksTable } from "./use-tasks-table";

// ============================================
// COMPONENTE: TareasTable
// Tabla principal de tareas con DnD y paginación
// ============================================

export default function TareasTable({
  tareas: initialTareas,
  onUpdate,
  onTareaClick,
  onTareasChange,
  hideControls = false,
}) {
  const {
    tareas,
    estados,
    sortConfig,
    seleccionadas,
    paginaActual,
    elementosPorPagina,
    sensors,
    tareasPaginadas,
    totalPaginas,
    indexPrimero,
    indexUltimo,
    handleSort,
    handleDragEnd,
    actualizarCelda,
    toggleSeleccion,
    toggleSeleccionarTodas,
    eliminarSeleccionadas,
    cambiarPagina,
    cambiarElementosPorPagina,
  } = useTasksTable({
    initialTareas,
    onUpdate,
    onTareasChange,
  });

  const crearNuevaTarea = () => {
    onTareaClick?.({
      id: null,
      nombre: "",
      descripcion: "",
      proceso_id: null,
      estado_id: null,
      prioridad: "media",
      empleado_asignado_id: null,
      fecha_limite: null,
      fecha_vencimiento: null,
      fecha_completada: null,
      tiempo_estimado: null,
      tiempo_real: null,
      notas: "",
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de selección múltiple */}
      {seleccionadas.size > 0 && (
        <div className="px-5 py-3 bg-linear-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl flex items-center justify-between shadow-sm">
          <span className="text-sm text-primary-900 font-semibold">
            {seleccionadas.size} tarea{seleccionadas.size !== 1 ? "s" : ""}{" "}
            seleccionada{seleccionadas.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={eliminarSeleccionadas}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="w-full overflow-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 dark:text-gray-300 w-8">
                  <input
                    type="checkbox"
                    checked={
                      tareas.length > 0 &&
                      seleccionadas.size ===
                        tareas.filter(
                          (t) => t.estado?.categoria !== "completado"
                        ).length &&
                      tareas.filter((t) => t.estado?.categoria !== "completado")
                        .length > 0
                    }
                    onChange={toggleSeleccionarTodas}
                    className="cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 dark:text-gray-300 w-8">
                  <GripVertical className="w-4 h-4 mx-auto text-gray-400 dark:text-gray-500" />
                </th>
                <ColumnHeader
                  label="Nombre"
                  columnId="nombre"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 w-32">
                  <div className="flex items-center gap-2">
                    <span>Estado</span>
                  </div>
                </th>
                <ColumnHeader
                  label="Responsables"
                  columnId="responsable"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Vencimiento"
                  columnId="fecha_vencimiento"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Importancia"
                  columnId="importancia"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Urgencia"
                  columnId="urgencia"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Personas Asignadas"
                  columnId="personas_asignadas"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
              </tr>
            </thead>
            <SortableContext
              items={tareasPaginadas.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {tareasPaginadas.map((tarea) => (
                  <SortableRow
                    key={tarea.id}
                    tarea={tarea}
                    estados={estados}
                    actualizarCelda={actualizarCelda}
                    onTareaClick={onTareaClick}
                    seleccionada={seleccionadas.has(tarea.id)}
                    onToggleSeleccion={toggleSeleccion}
                  />
                ))}
              </tbody>
            </SortableContext>
            <tbody>
              <tr className="hover:bg-blue-50/20 group">
                <td colSpan="9" className="px-3 py-2.5">
                  <button
                    onClick={crearNuevaTarea}
                    className="w-full text-left text-sm text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2 py-1"
                  >
                    <span className="text-base">+</span>
                    <span>Agregar tarea</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Paginación inferior */}
      {!hideControls && tareas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          {/* Selector e info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Mostrar
            </span>
            <select
              value={elementosPorPagina}
              onChange={(e) =>
                cambiarElementosPorPagina(Number(e.target.value))
              }
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-400 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {indexPrimero + 1}-{Math.min(indexUltimo, tareas.length)} de{" "}
              {tareas.length}
            </span>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={clsx(
                "p-1.5 text-xs rounded-md transition-colors",
                paginaActual === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-primary-600"
              )}
              title="Anterior"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              {paginaActual} / {totalPaginas}
            </span>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={clsx(
                "p-1.5 text-xs rounded-md transition-colors",
                paginaActual === totalPaginas
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-primary-600"
              )}
              title="Siguiente"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-exportar componentes de celdas para uso externo si es necesario
export * from "./table-cells";
