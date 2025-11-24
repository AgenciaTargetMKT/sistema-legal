"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, CheckCircle2, Clock, TrendingUp, Calendar } from "lucide-react";

export default function DesempenoMensualView() {
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    cargarEstadisticas();
  }, [mesActual]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Calcular fecha inicio y fin del mes
      const inicioMes = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth(),
        1
      );
      const finMes = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // Obtener todas las tareas del mes con empleados responsables
      const { data: tareas, error } = await supabase
        .from("tareas")
        .select(
          `
          id,
          nombre,
          fecha_completada,
          fecha_vencimiento,
          created_at,
          estado:estados_tarea(nombre),
          empleados_responsables:tareas_empleados_responsables(
            empleado:empleados(id, nombre, apellido)
          )
        `
        )
        .gte("created_at", inicioMes.toISOString())
        .lte("created_at", finMes.toISOString());

      if (error) {
        console.error("❌ Error cargando estadísticas:", error);
        throw error;
      }

      // Agrupar por empleado
      const estadisticasPorEmpleado = {};

      tareas?.forEach((tarea) => {
        const responsables = tarea.empleados_responsables || [];

        responsables.forEach((resp) => {
          const empleado = resp.empleado;
          if (!empleado) return;

          const empleadoId = empleado.id;
          const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;

          if (!estadisticasPorEmpleado[empleadoId]) {
            estadisticasPorEmpleado[empleadoId] = {
              id: empleadoId,
              nombre: nombreCompleto,
              completadas: 0,
              pendientes: 0,
              total: 0,
              porcentaje: 0,
            };
          }

          estadisticasPorEmpleado[empleadoId].total++;

          // Verificar si está completada por estado (finalizado/completada)
          const estadoNombre = tarea.estado?.nombre?.toLowerCase() || "";
          const estaCompletada =
            estadoNombre.includes("finaliz") ||
            estadoNombre.includes("completad") ||
            tarea.fecha_completada;

          if (estaCompletada) {
            estadisticasPorEmpleado[empleadoId].completadas++;
          } else {
            estadisticasPorEmpleado[empleadoId].pendientes++;
          }
        });
      });

      // Calcular porcentajes y convertir a array
      const stats = Object.values(estadisticasPorEmpleado).map((emp) => ({
        ...emp,
        porcentaje:
          emp.total > 0 ? Math.round((emp.completadas / emp.total) * 100) : 0,
      }));

      // Ordenar por total de tareas (más activos primero)
      stats.sort((a, b) => b.total - a.total);

      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (delta) => {
    setMesActual(
      new Date(mesActual.getFullYear(), mesActual.getMonth() + delta, 1)
    );
  };

  const mesNombre = mesActual.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const getPorcentajeColor = (porcentaje) => {
    if (porcentaje >= 80) return "text-green-600 bg-green-50";
    if (porcentaje >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            Cargando estadísticas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de mes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Desempeño Mensual</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarMes(-1)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium capitalize">{mesNombre}</span>
          </div>
          <button
            onClick={() => cambiarMes(1)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={
              mesActual.getMonth() === new Date().getMonth() &&
              mesActual.getFullYear() === new Date().getFullYear()
            }
          >
            →
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tareas</p>
                <p className="text-3xl font-bold">
                  {estadisticas.reduce((sum, e) => sum + e.total, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {estadisticas.reduce((sum, e) => sum + e.completadas, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {estadisticas.reduce((sum, e) => sum + e.pendientes, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {estadisticas.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No hay datos de desempeño para este mes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {estadisticas.map((empleado, index) => (
                <div
                  key={empleado.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {empleado.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          {empleado.total} tareas asignadas
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-lg ${getPorcentajeColor(
                        empleado.porcentaje
                      )}`}
                    >
                      {empleado.porcentaje}%
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-3">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${empleado.porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {empleado.completadas} completadas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-gray-600">
                        {empleado.pendientes} pendientes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
