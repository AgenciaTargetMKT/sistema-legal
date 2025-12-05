"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pause,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatearFecha } from "@/lib/utils";

export default function PausadasView({ onTareaClick }) {
  const [loading, setLoading] = useState(true);
  const [tareasPausadas, setTareasPausadas] = useState([]);

  useEffect(() => {
    cargarTareasPausadas();
  }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("tareas-pausadas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
        },
        () => {
          cargarTareasPausadas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarTareasPausadas = async () => {
    setLoading(true);
    try {
      // Primero obtener TODOS los IDs de estados "en pausa" o "pausado" o "pausada"
      const { data: estadosPausados, error: errorEstado } = await supabase
        .from("estados_tarea")
        .select("id, nombre")
        .or(
          "nombre.ilike.%en pausa%,nombre.ilike.%pausad%,nombre.ilike.%pausada%"
        );

      if (errorEstado || !estadosPausados || estadosPausados.length === 0) {
        console.error("❌ Error obteniendo estado pausado:", errorEstado);
        // Continuar sin filtro si no existe el estado
        setTareasPausadas([]);
        return;
      }

      // Obtener todos los IDs de estados pausados
      const idsPausados = estadosPausados.map((e) => e.id);

      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          id,
          nombre,
          descripcion,
          fecha_vencimiento,
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
        .in("estado_id", idsPausados)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error cargando tareas pausadas:", error);
        throw error;
      }

      setTareasPausadas(data || []);
    } catch (error) {
      console.error("Error cargando tareas pausadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasPausada = (fechaCreacion) => {
    const hoy = new Date();
    const creacion = new Date(fechaCreacion);
    const diferencia = hoy - creacion;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header mejorado */}
      <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Pause className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tareas Pausadas
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {tareasPausadas.length}{" "}
                {tareasPausadas.length === 1
                  ? "tarea pausada"
                  : "tareas en pausa"}
              </p>
            </div>
          </div>
          {tareasPausadas.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">
                Requieren atención
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de tareas pausadas */}
      {tareasPausadas.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-linear-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Excelente trabajo!
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No hay tareas pausadas en este momento. Todas las tareas están
                activas o completadas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tareasPausadas.map((tarea) => {
            const diasPausada = calcularDiasPausada(tarea.created_at);
            const responsables = tarea.empleados_responsables || [];
            const esUrgente = diasPausada > 7;

            return (
              <Card
                key={tarea.id}
                className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 overflow-hidden ${
                  esUrgente
                    ? "border-l-orange-500 bg-linear-to-r from-orange-50/50 to-white"
                    : "border-l-yellow-400 hover:border-l-yellow-500"
                }`}
                onClick={() => onTareaClick?.(tarea)}
              >
                <CardContent className="p-0">
                  <div className="p-6">
                    {/* Header mejorado */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                          esUrgente
                            ? "bg-linear-to-br from-orange-400 to-red-500"
                            : "bg-linear-to-br from-yellow-400 to-amber-500"
                        }`}
                      >
                        <Pause className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                            {tarea.nombre}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                              esUrgente
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {diasPausada} {diasPausada === 1 ? "día" : "días"}
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

                    {/* Alerta urgente */}
                    {esUrgente && (
                      <div className="mb-4 p-3 bg-linear-to-r from-orange-100 to-red-50 border-l-4 border-orange-500 rounded-r-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-orange-900">
                              Atención requerida
                            </p>
                            <p className="text-xs text-orange-700 mt-0.5">
                              Esta tarea lleva pausada {diasPausada} días
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grid de información */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* Responsables */}
                      {responsables.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {responsables.map((resp, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100"
                              >
                                {resp.empleado?.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fecha de vencimiento */}
                      {tarea.fecha_vencimiento && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">
                              Vencimiento
                            </p>
                            <p className="text-sm text-gray-700 font-semibold">
                              {formatearFecha(tarea.fecha_vencimiento)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cliente */}
                      {tarea.cliente && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-green-600" />
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
                  <div className="px-6 py-3 bg-linear-to-r from-gray-50 to-gray-100/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span>
                        Estado: <span className="font-semibold">Pausada</span>
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
