"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Clock,
  Award,
} from "lucide-react";
import { formatearFecha } from "@/lib/utils";

export default function FinalizadasView({ onTareaClick }) {
  const [loading, setLoading] = useState(true);
  const [tareasFinalizadas, setTareasFinalizadas] = useState([]);

  useEffect(() => {
    cargarTareasFinalizadas();

    // Suscripción en tiempo real
    const channel = supabase
      .channel("tareas-finalizadas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
        },
        () => {
          cargarTareasFinalizadas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarTareasFinalizadas = async () => {
    try {
      setLoading(true);

      // Buscar todos los estados que sean de categoría "completado"
      const { data: estadosFinalizados, error: errorEstados } = await supabase
        .from("estados_tarea")
        .select("id, nombre")
        .eq("categoria", "completado");

      if (errorEstados) throw errorEstados;

      if (!estadosFinalizados || estadosFinalizados.length === 0) {
        setTareasFinalizadas([]);
        return;
      }

      const idsFinalizados = estadosFinalizados.map((e) => e.id);

      // Cargar tareas finalizadas
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          id,
          nombre,
          descripcion,
          fecha_vencimiento,
          fecha_completada,
          created_at,
          notas,
          proceso:procesos(id, nombre),
          estado:estados_tarea(id, nombre, color, categoria),
          cliente:clientes(id, nombre),
          empleados_responsables:tareas_empleados_responsables(
            empleado:empleados(id, nombre, apellido)
          )
        `
        )
        .in("estado_id", idsFinalizados)
        .order("fecha_completada", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTareasFinalizadas(data || []);
    } catch (error) {
      console.error("❌ Error cargando tareas finalizadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempoCompletado = (fechaCreacion, fechaCompletada) => {
    if (!fechaCompletada) return null;

    const inicio = new Date(fechaCreacion);
    const fin = new Date(fechaCompletada);
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

    return dias;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tareas Finalizadas
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {tareasFinalizadas.length}{" "}
                {tareasFinalizadas.length === 1
                  ? "tarea completada"
                  : "tareas completadas"}
              </p>
            </div>
          </div>
          {tareasFinalizadas.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-200">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                ¡Buen trabajo!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de tareas finalizadas */}
      {tareasFinalizadas.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay tareas finalizadas
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Las tareas completadas aparecerán aquí para llevar un registro
                de tu trabajo.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tareasFinalizadas.map((tarea) => {
            const responsables = tarea.empleados_responsables || [];
            const diasCompletado = calcularTiempoCompletado(
              tarea.created_at,
              tarea.fecha_completada
            );

            return (
              <Card
                key={tarea.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-green-500 overflow-hidden"
                onClick={() => onTareaClick?.(tarea)}
              >
                <CardContent className="p-0">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                            {tarea.nombre}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completada
                          </span>
                        </div>

                        {tarea.proceso && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {tarea.proceso.nombre}
                            </span>
                          </div>
                        )}

                        {tarea.descripcion && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                            {tarea.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Grid de información */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {/* Fecha completada */}
                      {tarea.fecha_completada && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Completada
                            </p>
                            <p className="text-sm text-gray-700 font-semibold">
                              {formatearFecha(tarea.fecha_completada)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tiempo de completado */}
                      {diasCompletado !== null && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Tiempo
                            </p>
                            <p className="text-sm text-gray-700 font-semibold">
                              {diasCompletado}{" "}
                              {diasCompletado === 1 ? "día" : "días"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Responsables */}
                      {responsables.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {responsables.slice(0, 2).map((resp, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-100"
                              >
                                {resp.empleado?.nombre}
                              </span>
                            ))}
                            {responsables.length > 2 && (
                              <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium">
                                +{responsables.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cliente */}
                      {tarea.cliente && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 font-medium">
                              Cliente
                            </p>
                            <p className="text-sm text-gray-700 font-semibold truncate">
                              {tarea.cliente.nombre}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {tarea.notas && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-semibold mb-1">
                              Notas
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {tarea.notas}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con gradiente */}
                  <div className="px-6 py-3 bg-linear-to-r from-green-50 to-emerald-50/50 border-t border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>
                        Estado:{" "}
                        <span className="font-semibold text-green-700">
                          Finalizada
                        </span>
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-2 transition-all">
                      <span>Ver detalles</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
