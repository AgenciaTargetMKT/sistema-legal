"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Clock,
  AlertCircle,
  FileText,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { formatearFecha, estaVencido } from "@/lib/utils";

export default function TareasTableNotion({ tareas, onTareaClick, onUpdate }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (tareaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tareaId)) {
      newExpanded.delete(tareaId);
    } else {
      newExpanded.add(tareaId);
    }
    setExpandedRows(newExpanded);
  };

  const getEstadoStyle = (estado) => {
    const color = estado?.color || "#6B7280";
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}50`,
    };
  };

  const getPrioridadBadge = (importancia, urgencia) => {
    if (importancia === "importante" && urgencia === "urgente") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          🔴 Crítica
        </span>
      );
    }
    if (importancia === "importante") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
          🟠 Importante
        </span>
      );
    }
    if (urgencia === "urgente") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
          🟡 Urgente
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        ⚪ Normal
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tarea
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Responsables
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Vencimiento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tareas.map((tarea) => {
              const isExpanded = expandedRows.has(tarea.id);
              const isVencida =
                tarea.fecha_vencimiento &&
                estaVencido(tarea.fecha_vencimiento) &&
                tarea.estado?.categoria !== "completado";

              return (
                <>
                  {/* Fila principal */}
                  <motion.tr
                    key={tarea.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(tarea.id)}
                    whileHover={{ backgroundColor: "#F9FAFB" }}
                  >
                    <td className="px-4 py-3">
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </motion.div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {tarea.nombre}
                          </div>
                          {tarea.proceso && (
                            <div className="text-xs text-gray-500 truncate">
                              {tarea.proceso.nombre}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tarea.estado && (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={getEstadoStyle(tarea.estado)}
                        >
                          {tarea.estado.nombre}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getPrioridadBadge(tarea.importancia, tarea.urgencia)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {tarea.empleados_responsables
                          ?.slice(0, 3)
                          .map((emp, idx) => (
                            <div
                              key={idx}
                              className="h-8 w-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-medium text-primary-700"
                              title={`${emp.empleado?.nombre} ${emp.empleado?.apellido}`}
                            >
                              {emp.empleado?.nombre?.[0]}
                              {emp.empleado?.apellido?.[0]}
                            </div>
                          ))}
                        {tarea.empleados_responsables?.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                            +{tarea.empleados_responsables.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tarea.fecha_vencimiento && (
                        <div
                          className={`flex items-center gap-1.5 text-sm ${
                            isVencida
                              ? "text-red-600 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          {formatearFecha(tarea.fecha_vencimiento)}
                          {isVencida && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>

                  {/* Fila expandida con detalles */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        key={`${tarea.id}-expanded`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td colSpan={6} className="bg-gray-50 px-4 py-0">
                          <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            className="py-4 space-y-4"
                          >
                            {/* Grid de información */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Cliente */}
                              {tarea.cliente && (
                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                  <User className="h-5 w-5 text-blue-500 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase">
                                      Cliente
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {tarea.cliente.nombre}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Fecha límite */}
                              {tarea.fecha_limite && (
                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase">
                                      Fecha Límite
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatearFecha(tarea.fecha_limite)}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Descripción */}
                              {tarea.descripcion && (
                                <div className="md:col-span-2 p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                                    Descripción
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {tarea.descripcion}
                                  </p>
                                </div>
                              )}

                              {/* Empleados designados */}
                              {tarea.empleados_designados &&
                                tarea.empleados_designados.length > 0 && (
                                  <div className="md:col-span-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                                      Empleados Designados
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {tarea.empleados_designados.map(
                                        (emp, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                          >
                                            <User className="h-3.5 w-3.5" />
                                            {emp.empleado?.nombre}{" "}
                                            {emp.empleado?.apellido}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Botón para abrir panel completo */}
                            <div className="flex justify-end pt-2 border-t border-gray-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTareaClick(tarea);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Ver detalles completos y notas
                              </button>
                            </div>
                          </motion.div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {tareas.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No hay tareas para mostrar</p>
        </div>
      )}
    </div>
  );
}
