"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import { formatearFecha, estaVencido } from "@/lib/utils";

export default function ProcesoTareasPanel({
  proceso,
  open,
  onClose,
  onNuevaTarea,
}) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarTareas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          estado:estados_tarea(nombre, color),
          empleado:empleados(nombre, apellido)
        `
        )
        .eq("proceso_id", proceso.id)
        .order("fecha_vencimiento", { ascending: true });

      if (error) throw error;
      setTareas(data || []);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    } finally {
      setLoading(false);
    }
  }, [proceso]);

  useEffect(() => {
    if (open && proceso) {
      cargarTareas();
    }
  }, [open, proceso, cargarTareas]);

  const getPrioridadColor = (prioridad) => {
    const colores = {
      baja: "bg-gray-100 text-gray-800",
      media: "bg-blue-100 text-blue-800",
      alta: "bg-orange-100 text-orange-800",
      urgente: "bg-red-100 text-red-800",
    };
    return colores[prioridad] || "bg-gray-100 text-gray-800";
  };

  const getEstadoIcon = (estadoNombre) => {
    switch (estadoNombre?.toLowerCase()) {
      case "completada":
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case "en progreso":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "pendiente":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay que cubre todo incluyendo el sidebar */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        style={{ left: 0 }}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white border-b z-10 shadow-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {proceso.numero_proceso}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{proceso.nombre}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Proceso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Proceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">
                    {proceso.cliente?.nombre || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Materia</p>
                  <p className="font-medium">
                    {proceso.materia?.nombre || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      proceso.estado_general === "activo"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {proceso.estado_general || "Sin estado"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Inicio</p>
                  <p className="font-medium">
                    {proceso.fecha_inicio
                      ? formatearFecha(proceso.fecha_inicio)
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tareas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Tareas del Proceso
                <span className="text-sm text-gray-500">({tareas.length})</span>
              </h3>
              <Button
                size="sm"
                onClick={() => onNuevaTarea?.(proceso)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva Tarea
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando tareas...</p>
                </div>
              </div>
            ) : tareas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No hay tareas asignadas
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Crea la primera tarea para este proceso
                  </p>
                  <Button onClick={() => onNuevaTarea?.(proceso)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Tarea
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tareas.map((tarea) => (
                  <Card
                    key={tarea.id}
                    className={`hover:shadow-md transition-shadow ${
                      estaVencido(tarea.fecha_vencimiento)
                        ? "border-red-300 bg-red-50"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getEstadoIcon(tarea.estado?.nombre)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {tarea.nombre}
                            </h4>
                            {tarea.descripcion && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {tarea.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPrioridadColor(
                            tarea.prioridad
                          )}`}
                        >
                          {tarea.prioridad}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-3">
                        {tarea.estado && (
                          <div className="flex items-center gap-1">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: tarea.estado.color || "#gray",
                              }}
                            ></span>
                            <span>{tarea.estado.nombre}</span>
                          </div>
                        )}
                        {tarea.fecha_vencimiento && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span
                              className={
                                estaVencido(tarea.fecha_vencimiento)
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {formatearFecha(tarea.fecha_vencimiento)}
                            </span>
                          </div>
                        )}
                        {tarea.empleado && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {tarea.empleado.nombre} {tarea.empleado.apellido}
                            </span>
                          </div>
                        )}
                        {tarea.tiempo_estimado && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{tarea.tiempo_estimado}h</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
