"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  Target,
} from "lucide-react";

// Cargar ECharts dinámicamente para evitar SSR issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

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

      // Obtener tareas CREADAS en el mes seleccionado (responsables + designados)
      const { data: tareas, error } = await supabase
        .from("tareas")
        .select(
          `
          id,
          nombre,
          fecha_completada,
          fecha_vencimiento,
          created_at,
          estado:estados_tarea(nombre, categoria),
          empleados_responsables:tareas_empleados_responsables(
            empleado:empleados(id, nombre, apellido)
          ),
          empleados_designados:tareas_empleados_designados(
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

      // Agrupar por empleado (responsables + designados)
      const estadisticasPorEmpleado = {};

      tareas?.forEach((tarea) => {
        // Verificar si está completada
        const estadoCategoria = tarea.estado?.categoria?.toLowerCase() || "";
        const estadoNombre = tarea.estado?.nombre?.toLowerCase() || "";
        const estaCompletada =
          estadoCategoria === "completado" ||
          estadoNombre.includes("finaliz") ||
          estadoNombre.includes("completad") ||
          tarea.fecha_completada;

        // Combinar responsables y designados
        const responsables = tarea.empleados_responsables || [];
        const designados = tarea.empleados_designados || [];
        const todosEmpleados = [...responsables, ...designados];

        // Usar Set para evitar contar al mismo empleado dos veces en la misma tarea
        const empleadosUnicos = new Map();
        todosEmpleados.forEach((emp) => {
          const empleado = emp.empleado;
          if (empleado) {
            empleadosUnicos.set(empleado.id, empleado);
          }
        });

        empleadosUnicos.forEach((empleado) => {
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

  // Configuración del gráfico de barras VERTICAL (Desempeño por Usuario)
  const getBarChartOption = () => ({
    title: {
      text: "Tareas por Empleado",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params) => {
        const dataIndex = params[0].dataIndex;
        const empleado = estadisticas[dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${empleado.nombre}</div>
            <div style="color: #10b981;">✓ Completadas: ${empleado.completadas}</div>
            <div style="color: #f59e0b;">⏱ Pendientes: ${empleado.pendientes}</div>
            <div style="margin-top: 4px; font-weight: bold;">Total: ${empleado.total}</div>
          </div>
        `;
      },
    },
    legend: {
      data: ["Completadas", "Pendientes"],
      bottom: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: estadisticas.map((e) => e.nombre.split(" ")[0]),
      axisLabel: {
        interval: 0,
        rotate: 0,
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      name: "Tareas",
    },
    series: [
      {
        name: "Completadas",
        type: "bar",
        stack: "total",
        data: estadisticas.map((e) => e.completadas),
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 1,
            x2: 0,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#059669" },
              { offset: 1, color: "#10b981" },
            ],
          },
        },
        emphasis: {
          focus: "series",
        },
        label: {
          show: true,
          position: "inside",
          formatter: "{c}",
          color: "#fff",
          fontWeight: "bold",
        },
        animationDelay: (idx) => idx * 100,
      },
      {
        name: "Pendientes",
        type: "bar",
        stack: "total",
        data: estadisticas.map((e) => e.pendientes),
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 1,
            x2: 0,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#d97706" },
              { offset: 1, color: "#f59e0b" },
            ],
          },
        },
        emphasis: {
          focus: "series",
        },
        label: {
          show: true,
          position: "inside",
          formatter: "{c}",
          color: "#fff",
          fontWeight: "bold",
        },
        animationDelay: (idx) => idx * 100,
      },
    ],
    animationEasing: "elasticOut",
    animationDelayUpdate: (idx) => idx * 50,
  });

  // Configuración del gráfico de gauge (Porcentaje de completitud general)
  const getGaugeChartOption = () => {
    const totalTareas = estadisticas.reduce((sum, e) => sum + e.total, 0);
    const completadas = estadisticas.reduce((sum, e) => sum + e.completadas, 0);
    const porcentajeGeneral =
      totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

    return {
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          center: ["50%", "75%"],
          radius: "90%",
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 15,
              color: [
                [0.3, "#ef4444"],
                [0.7, "#f59e0b"],
                [1, "#10b981"],
              ],
            },
          },
          pointer: {
            itemStyle: {
              color: "auto",
            },
          },
          axisTick: {
            distance: -15,
            length: 8,
            lineStyle: {
              color: "#fff",
              width: 2,
            },
          },
          splitLine: {
            distance: -20,
            length: 15,
            lineStyle: {
              color: "#fff",
              width: 4,
            },
          },
          axisLabel: {
            color: "inherit",
            distance: 25,
            fontSize: 14,
            formatter: (value) => value + "%",
          },
          detail: {
            valueAnimation: true,
            formatter: "{value}%",
            color: "inherit",
            fontSize: 32,
            fontWeight: "bold",
            offsetCenter: [0, "-15%"],
          },
          title: {
            offsetCenter: [0, "30%"],
            fontSize: 16,
            color: "#6b7280",
          },
          data: [
            {
              value: porcentajeGeneral,
              name: "Completitud General",
            },
          ],
        },
      ],
    };
  };

  // Configuración del gráfico pie (Distribución de tareas)
  const getPieChartOption = () => {
    const totalCompletadas = estadisticas.reduce(
      (sum, e) => sum + e.completadas,
      0
    );
    const totalPendientes = estadisticas.reduce(
      (sum, e) => sum + e.pendientes,
      0
    );

    return {
      title: {
        text: "Distribución de Tareas",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
          color: "#1f2937",
        },
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "horizontal",
        bottom: 10,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: "{b}\n{d}%",
            fontSize: 13,
            fontWeight: "bold",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data: [
            {
              value: totalCompletadas,
              name: "Completadas",
              itemStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "#34d399" },
                    { offset: 1, color: "#059669" },
                  ],
                },
              },
            },
            {
              value: totalPendientes,
              name: "Pendientes",
              itemStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "#fbbf24" },
                    { offset: 1, color: "#d97706" },
                  ],
                },
              },
            },
          ],
          animationType: "scale",
          animationEasing: "elasticOut",
          animationDelay: () => Math.random() * 200,
        },
      ],
    };
  };

  // Configuración del gráfico de radar (Comparación de empleados)
  const getRadarChartOption = () => {
    const topEmpleados = estadisticas; // TODOS los empleados

    return {
      title: {
        text: "Comparación de Desempeño",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold",
          color: "#1f2937",
        },
      },
      tooltip: {
        trigger: "item",
      },
      legend: {
        bottom: 10,
        data: topEmpleados.map((e) => e.nombre.split(" ")[0]),
        type: "scroll",
      },
      radar: {
        indicator: [
          { name: "Total", max: Math.max(...topEmpleados.map((e) => e.total)) },
          {
            name: "Completadas",
            max: Math.max(...topEmpleados.map((e) => e.completadas)),
          },
          { name: "% Completitud", max: 100 },
          {
            name: "Pendientes",
            max: Math.max(...topEmpleados.map((e) => e.pendientes)),
          },
        ],
        shape: "polygon",
        splitNumber: 4,
      },
      series: [
        {
          type: "radar",
          data: topEmpleados.map((empleado, idx) => ({
            value: [
              empleado.total,
              empleado.completadas,
              empleado.porcentaje,
              empleado.pendientes,
            ],
            name: empleado.nombre.split(" ")[0],
            itemStyle: {
              color: [
                "#3b82f6",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
                "#f97316",
              ][idx % 8],
            },
          })),
          animationDelay: (idx) => idx * 100,
        },
      ],
    };
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

  const totalTareas = estadisticas.reduce((sum, e) => sum + e.total, 0);
  const completadas = estadisticas.reduce((sum, e) => sum + e.completadas, 0);
  const pendientes = estadisticas.reduce((sum, e) => sum + e.pendientes, 0);

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

      {/* Cards de resumen con animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tareas</p>
                <p className="text-4xl font-bold bg-linear-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {totalTareas}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Target className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-4xl font-bold bg-linear-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
                  {completadas}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-4xl font-bold bg-linear-to-r from-orange-600 to-amber-400 bg-clip-text text-transparent">
                  {pendientes}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {estadisticas.length === 0 ? (
        <div className="text-center py-20 bg-linear-to-br from-gray-50 to-slate-50 rounded-2xl shadow-lg border border-gray-200">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg mb-5 mx-auto">
            <User className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            No hay datos de desempeño
          </h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            No hay tareas registradas para este mes
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico de barras y Radar lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico de barras (Desempeño por usuario) - 2/3 del ancho */}
            <Card className="hover:shadow-lg transition-shadow lg:col-span-2">
              <CardContent className="pt-6">
                <ReactECharts
                  option={getBarChartOption()}
                  style={{ height: "450px" }}
                  opts={{ renderer: "svg" }}
                />
              </CardContent>
            </Card>

            {/* Gráfico de radar (Comparación) - 1/3 del ancho */}
            <Card className="hover:shadow-lg transition-shadow lg:col-span-1">
              <CardContent className="pt-6">
                <ReactECharts
                  option={getRadarChartOption()}
                  style={{ height: "450px" }}
                  opts={{ renderer: "svg" }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Top performers */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <CardTitle>Top Performers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estadisticas.map((empleado, index) => (
                  <div
                    key={empleado.id}
                    className="flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md text-white font-bold text-lg ${
                        index === 0
                          ? "bg-linear-to-br from-yellow-400 to-yellow-600"
                          : index === 1
                          ? "bg-linear-to-br from-gray-400 to-gray-600"
                          : index === 2
                          ? "bg-linear-to-br from-orange-400 to-orange-600"
                          : "bg-linear-to-br from-blue-400 to-blue-600"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {empleado.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {empleado.total} tareas • {empleado.completadas}{" "}
                        completadas
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-lg shadow-sm ${getPorcentajeColor(
                        empleado.porcentaje
                      )}`}
                    >
                      {empleado.porcentaje}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
