"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatearFecha, diasRestantes, estaVencido } from "@/lib/utils";
import { FullCalendarWidget } from "@/components/dashboard/full-calendar-widget";

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
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Calendario - Ocupa todo el ancho */}
      <div className="w-full">
        <FullCalendarWidget />
      </div>

      {/* Contenido en grid: Procesos, Tareas e Impulsos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procesos sin actualizar */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Procesos Sin Actualizar
            </h2>
            <Link
              href="/procesos"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {procesosRecientes.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay procesos pendientes
              </p>
            ) : (
              procesosRecientes.map((proceso) => (
                <div
                  key={proceso.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {proceso.numero_proceso}
                    </p>
                    <p className="text-sm text-gray-600">{proceso.titulo}</p>
                    <p className="text-xs text-gray-500">
                      Cliente: {proceso.clientes?.nombre}{" "}
                      {proceso.clientes?.apellido}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {diasRestantes(proceso.fecha_ultima_actualizacion)} días
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tareas vencidas */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Tareas Vencidas
            </h2>
            <Link
              href="/tareas"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-3">
            {tareasVencidas.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay tareas vencidas</p>
            ) : (
              tareasVencidas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tarea.titulo}</p>
                    <p className="text-sm text-gray-600">
                      {tarea.procesos?.numero_proceso}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
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

        {/* Espacio adicional o widget futuro */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-sm">Espacio disponible para más widgets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Impulsos próximos */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Próximos Impulsos
          </h2>
          <Link
            href="/impulsos"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {impulsosProximos.length === 0 ? (
            <p className="text-gray-500 text-sm col-span-full">
              No hay impulsos próximos
            </p>
          ) : (
            impulsosProximos.map((impulso) => (
              <div
                key={impulso.id}
                className="p-4 bg-blue-50 rounded-lg border border-blue-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {impulso.tipo}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatearFecha(impulso.fecha_impulso)}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{impulso.titulo}</p>
                <p className="text-sm text-gray-600">
                  {impulso.procesos?.numero_proceso}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
