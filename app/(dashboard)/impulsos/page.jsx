"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  User,
  CalendarCheck,
} from "lucide-react";

export default function ImpulsosPage() {
  const [impulsos, setImpulsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    cargarImpulsos();
  }, []);

  const cargarImpulsos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("impulsos")
        .select(
          `
          *,
          proceso:procesos(numero_proceso, nombre),
          empleado_responsable:empleados(nombre, apellido)
        `
        )
        .order("fecha_impulso", { ascending: true });

      if (error) throw error;
      setImpulsos(data || []);
    } catch (error) {
      console.error("Error al cargar impulsos:", error);
    } finally {
      setLoading(false);
    }
  };

  const impulsosFiltrados = impulsos.filter((impulso) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      impulso.descripcion?.toLowerCase().includes(searchLower) ||
      impulso.proceso?.numero_proceso?.toLowerCase().includes(searchLower) ||
      impulso.proceso?.nombre?.toLowerCase().includes(searchLower);

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "realizado" && impulso.realizado) ||
      (filtroEstado === "pendiente" && !impulso.realizado);

    return matchSearch && matchEstado;
  });

  // Estadísticas
  const stats = {
    total: impulsos.length,
    pendientes: impulsos.filter((i) => !i.realizado).length,
    realizados: impulsos.filter((i) => i.realizado).length,
    hoy: impulsos.filter((i) => {
      if (!i.fecha_impulso) return false;
      const hoy = new Date().toISOString().split("T")[0];
      const fechaImpulso = i.fecha_impulso.split("T")[0];
      return fechaImpulso === hoy;
    }).length,
    vencidos: impulsos.filter(
      (i) => !i.realizado && i.fecha_impulso && estaVencido(i.fecha_impulso)
    ).length,
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case "audiencia":
        return "bg-red-100 text-red-700 border-red-200";
      case "presentación":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "notificación":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "seguimiento":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "otro":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impulsos</h1>
          <p className="text-muted-foreground">
            Gestiona los impulsos procesales y recordatorios
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Impulso
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impulsos
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendientes}
            </div>
            <p className="text-xs text-muted-foreground">Por realizar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.realizados}
            </div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.hoy}</div>
            <p className="text-xs text-muted-foreground">Para hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.vencidos}
            </div>
            <p className="text-xs text-muted-foreground">Atrasados</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Impulsos</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descripción o proceso..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="realizado">Realizados</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Cargando impulsos...
                </p>
              </div>
            </div>
          ) : impulsosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay impulsos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron impulsos con ese criterio"
                  : "Comienza agregando tu primer impulso"}
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Impulso
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {impulsosFiltrados.map((impulso) => {
                const vencido =
                  !impulso.realizado &&
                  impulso.fecha_impulso &&
                  estaVencido(impulso.fecha_impulso);

                const esHoy =
                  impulso.fecha_impulso &&
                  new Date().toISOString().split("T")[0] ===
                    impulso.fecha_impulso.split("T")[0];

                return (
                  <Card
                    key={impulso.id}
                    className={`hover:shadow-md transition-shadow ${
                      vencido
                        ? "border-red-300 bg-red-50/50"
                        : esHoy && !impulso.realizado
                        ? "border-blue-300 bg-blue-50/50"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div
                          className={`mt-1 rounded-full p-2 ${
                            impulso.realizado
                              ? "bg-green-100"
                              : vencido
                              ? "bg-red-100"
                              : esHoy
                              ? "bg-blue-100"
                              : "bg-orange-100"
                          }`}
                        >
                          {impulso.realizado ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : vencido ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : esHoy ? (
                            <CalendarCheck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-600" />
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {impulso.descripcion}
                              </h3>
                              {impulso.observaciones && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {impulso.observaciones}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Info */}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {impulso.proceso && (
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="font-medium">
                                  {impulso.proceso.numero_proceso}
                                </span>
                                {impulso.proceso.nombre && (
                                  <span className="text-xs">
                                    - {impulso.proceso.nombre}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {impulso.fecha_impulso && (
                              <div
                                className={`flex items-center gap-1.5 ${
                                  vencido
                                    ? "text-red-600 font-medium"
                                    : esHoy
                                    ? "text-blue-600 font-medium"
                                    : ""
                                }`}
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {formatearFecha(impulso.fecha_impulso)}
                                </span>
                                {vencido && (
                                  <AlertCircle className="h-3.5 w-3.5" />
                                )}
                                {esHoy && !impulso.realizado && (
                                  <span className="text-xs font-medium">
                                    (Hoy)
                                  </span>
                                )}
                              </div>
                            )}
                            {impulso.empleado_responsable && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span>
                                  {impulso.empleado_responsable.nombre}{" "}
                                  {impulso.empleado_responsable.apellido}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Badges y Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                              {impulso.tipo && (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getTipoColor(
                                    impulso.tipo
                                  )}`}
                                >
                                  {impulso.tipo}
                                </span>
                              )}
                              {impulso.realizado ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Realizado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                  <Clock className="h-3 w-3" />
                                  Pendiente
                                </span>
                              )}
                              {impulso.notificacion_enviada && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                  <Bell className="h-3 w-3" />
                                  Notificado
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
