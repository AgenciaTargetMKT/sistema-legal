"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatearFecha, diasRestantes, estaVencido } from "@/lib/utils";
import { FullCalendarWidget } from "@/components/dashboard/full-calendar-widget";
import { TodayEventsWidget } from "@/components/dashboard/today-events-widget";
import { Scale, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProcesos: 0,
    procesosActivos: 0,
    tareasVencidas: 0,
    impulsosHoy: 0,
  });
  const [procesosRecientes, setProcesosRecientes] = useState([]);
  const [tareasVencidas, setTareasVencidas] = useState([]);
  const [impulsosProximos, setImpulsosProximos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    setLoading(true);

    try {
      // Estadísticas generales
      const { data: procesos } = await supabase
        .from("procesos")
        .select("id, estado");

      const { data: tareas } = await supabase
        .from("tareas")
        .select("id, fecha_vencimiento, estado")
        .lt("fecha_vencimiento", new Date().toISOString())
        .neq("estado", "completada");

      const { data: impulsos } = await supabase
        .from("impulsos")
        .select("id")
        .gte("fecha_impulso", new Date().toISOString().split("T")[0])
        .lt(
          "fecha_impulso",
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        );

      // Procesos recientes sin actualizar
      const { data: procesosNoActualizados } = await supabase
        .from("procesos")
        .select(
          `
          id, numero_proceso, titulo, fecha_ultima_actualizacion,
          clientes(nombre, apellido)
        `
        )
        .eq("estado", "activo")
        .order("fecha_ultima_actualizacion", { ascending: true })
        .limit(5);

      // Tareas vencidas
      const { data: tareasVencidasData } = await supabase
        .from("tareas")
        .select(
          `
          id, titulo, fecha_vencimiento,
          procesos(numero_proceso, titulo)
        `
        )
        .lt("fecha_vencimiento", new Date().toISOString())
        .neq("estado", "completada")
        .order("fecha_vencimiento", { ascending: true })
        .limit(5);

      // Impulsos próximos
      const { data: impulsosProximosData } = await supabase
        .from("impulsos")
        .select(
          `
          id, titulo, fecha_impulso, tipo,
          procesos(numero_proceso, titulo)
        `
        )
        .gte("fecha_impulso", new Date().toISOString())
        .eq("estado", "activo")
        .order("fecha_impulso", { ascending: true })
        .limit(5);

      setStats({
        totalProcesos: procesos?.length || 0,
        procesosActivos:
          procesos?.filter((p) => p.estado === "activo")?.length || 0,
        tareasVencidas: tareas?.length || 0,
        impulsosHoy: impulsos?.length || 0,
      });

      setProcesosRecientes(procesosNoActualizados || []);
      setTareasVencidas(tareasVencidasData || []);
      setImpulsosProximos(impulsosProximosData || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-muted-foreground">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Procesos */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {stats.totalProcesos}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Procesos</p>
          <p className="text-xs text-gray-400 mt-1">En el sistema</p>
        </div>

        {/* Procesos Activos */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {stats.procesosActivos}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Procesos Activos</p>
          <p className="text-xs text-gray-400 mt-1">En progreso</p>
        </div>

        {/* Tareas Vencidas */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {stats.tareasVencidas}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Tareas Vencidas</p>
          <p className="text-xs text-gray-400 mt-1">Requieren atención</p>
        </div>

        {/* Impulsos Hoy */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {stats.impulsosHoy}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Impulsos Hoy</p>
          <p className="text-xs text-gray-400 mt-1">Programados</p>
        </div>
      </div>
      {/* Grid: Eventos de Hoy + Impulsos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eventos de Hoy */}
        <TodayEventsWidget />
        {/* Impulsos próximos - 2 columnas */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Próximos Impulsos
            </h2>
            <Link
              href="/impulsos"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {impulsosProximos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center col-span-full">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  No hay impulsos próximos
                </p>
              </div>
            ) : (
              impulsosProximos.map((impulso) => (
                <div
                  key={impulso.id}
                  className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-purple-500 text-white rounded-full">
                      {impulso.tipo}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      {formatearFecha(impulso.fecha_impulso)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mt-2">
                    {impulso.titulo}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {impulso.procesos?.numero_proceso}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Contenido en grid: Procesos y Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procesos sin actualizar */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Procesos Sin Actualizar
            </h2>
            <Link
              href="/procesos"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          <div className="space-y-3">
            {procesosRecientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Scale className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  No hay procesos pendientes
                </p>
              </div>
            ) : (
              procesosRecientes.map((proceso) => (
                <div
                  key={proceso.id}
                  className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-50/50 rounded-lg hover:from-blue-50 hover:to-blue-50/50 transition-colors border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {proceso.numero_proceso}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {proceso.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cliente: {proceso.clientes?.nombre}{" "}
                      {proceso.clientes?.apellido}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                      {diasRestantes(proceso.fecha_ultima_actualizacion)} días
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tareas vencidas */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Tareas Vencidas
            </h2>
            <Link
              href="/tareas"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Ver todas →
            </Link>
          </div>

          <div className="space-y-3">
            {tareasVencidas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm">No hay tareas vencidas</p>
              </div>
            ) : (
              tareasVencidas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between p-4 bg-linear-to-r from-red-50 to-red-50/50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {tarea.titulo}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {tarea.procesos?.numero_proceso}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                      Vencida
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatearFecha(tarea.fecha_vencimiento)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen Rápido */}
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-white">
          <h3 className="text-lg font-semibold mb-4">Resumen Rápido</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span className="text-sm opacity-90">Total Procesos</span>
              <span className="font-bold text-lg">{stats.totalProcesos}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span className="text-sm opacity-90">Activos</span>
              <span className="font-bold text-lg">{stats.procesosActivos}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span className="text-sm opacity-90">Vencidas</span>
              <span className="font-bold text-lg">{stats.tareasVencidas}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm opacity-90">Impulsos Hoy</span>
              <span className="font-bold text-lg">{stats.impulsosHoy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
