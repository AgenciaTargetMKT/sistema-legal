"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, TrendingUp, FileText, PieChart } from "lucide-react";
import ReactECharts from "echarts-for-react";

export default function EstadisticasProcesos({ procesos, estados }) {
  // Calcular estadísticas por estado
  const estadisticas = useMemo(() => {
    const total = procesos.length;

    // Agrupar por estado
    const porEstado = estados
      .map((estado) => {
        const cantidad = procesos.filter(
          (p) => p.estado_id === estado.id
        ).length;
        const porcentaje =
          total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0;

        return {
          ...estado,
          cantidad,
          porcentaje: parseFloat(porcentaje),
        };
      })
      .filter((e) => e.cantidad > 0);

    // Ordenar por cantidad descendente
    porEstado.sort((a, b) => b.cantidad - a.cantidad);

    return {
      total,
      porEstado,
    };
  }, [procesos, estados]);

  // Obtener color de fondo y texto para un estado
  const getEstadoColors = (estado) => {
    if (estado.color) {
      return {
        bg: `${estado.color}15`,
        text: estado.color,
        border: `${estado.color}30`,
      };
    }
    // Colores por defecto si no hay color
    return {
      bg: "#E5E7EB",
      text: "#6B7280",
      border: "#D1D5DB",
    };
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de resumen */}
      <Card className="border-2 border-primary-100 bg-linear-to-br from-primary-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary-600" />
            Resumen de Procesos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary-600">
            {estadisticas.total}
          </div>
          <p className="text-sm text-gray-600 mt-1">procesos totales</p>
        </CardContent>
      </Card>

      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Procesos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.porEstado.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay procesos para mostrar</p>
              </div>
            ) : (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: "axis",
                    axisPointer: {
                      type: "shadow",
                    },
                    formatter: (params) => {
                      const data = params[0];
                      return `${data.name}<br/>${data.value} procesos (${
                        estadisticas.porEstado.find(
                          (e) => e.nombre === data.name
                        )?.porcentaje
                      }%)`;
                    },
                  },
                  grid: {
                    left: "3%",
                    right: "4%",
                    bottom: "3%",
                    containLabel: true,
                  },
                  xAxis: {
                    type: "value",
                    boundaryGap: [0, 0.01],
                  },
                  yAxis: {
                    type: "category",
                    data: estadisticas.porEstado.map((e) => e.nombre),
                  },
                  series: [
                    {
                      name: "Procesos",
                      type: "bar",
                      data: estadisticas.porEstado.map((e) => ({
                        value: e.cantidad,
                        itemStyle: {
                          color: e.color || "#6B7280",
                        },
                      })),
                      label: {
                        show: true,
                        position: "right",
                        formatter: "{c}",
                      },
                    },
                  ],
                }}
                style={{ height: "350px" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pastel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary-600" />
              Distribución Porcentual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.porEstado.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay procesos para mostrar</p>
              </div>
            ) : (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: "item",
                    formatter: "{b}: {c} ({d}%)",
                  },
                  legend: {
                    orient: "vertical",
                    left: "left",
                    textStyle: {
                      fontSize: 12,
                    },
                  },
                  series: [
                    {
                      name: "Procesos",
                      type: "pie",
                      radius: ["40%", "70%"],
                      avoidLabelOverlap: false,
                      itemStyle: {
                        borderRadius: 10,
                        borderColor: "#fff",
                        borderWidth: 2,
                      },
                      label: {
                        show: true,
                        formatter: "{d}%",
                      },
                      emphasis: {
                        label: {
                          show: true,
                          fontSize: 16,
                          fontWeight: "bold",
                        },
                      },
                      data: estadisticas.porEstado.map((e) => ({
                        value: e.cantidad,
                        name: e.nombre,
                        itemStyle: {
                          color: e.color || "#6B7280",
                        },
                      })),
                    },
                  ],
                }}
                style={{ height: "350px" }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución visual con cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {estadisticas.porEstado.slice(0, 4).map((estado) => {
          const colors = getEstadoColors(estado);
          return (
            <Card
              key={estado.id}
              className="border-2 transition-all hover:shadow-md"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: colors.text }}
                    >
                      {estado.nombre}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {estado.cantidad}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({estado.porcentaje}%)
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.text + "20" }}
                  >
                    <FileText
                      className="h-6 w-6"
                      style={{ color: colors.text }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
