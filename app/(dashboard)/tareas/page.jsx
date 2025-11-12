"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TareaDialog from "@/components/dashboard/tarea-dialog";
import TareasTable from "@/components/editable-table/TareasTable";
import TareaPanel from "@/components/editable-table/TareaPanel";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  User,
  FileText,
  LayoutGrid,
  Table,
} from "lucide-react";

export default function TareasPage() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState("tabla");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          proceso:procesos(numero_proceso, nombre),
          empleado_asignado:empleados(nombre, apellido),
          estado:estados_tarea(nombre, color)
        `
        )
        .order("orden", { ascending: true });

      if (error) throw error;
      setTareas(data || []);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaTarea = () => {
    // Crear una tarea vacía para el panel
    setTareaSeleccionada({
      id: null,
      nombre: "",
      descripcion: "",
      proceso_id: null,
      estado_id: null,
      prioridad: "media",
      empleado_asignado_id: null,
      fecha_limite: null,
      fecha_vencimiento: null,
      fecha_completada: null,
      tiempo_estimado: null,
      tiempo_real: null,
      observaciones: "",
    });
    setPanelOpen(true);
  };

  const handleEditarTarea = (tarea) => {
    setTareaSeleccionada(tarea);
    setPanelOpen(true);
  };

  const handleSuccess = () => {
    cargarTareas();
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      tarea.titulo?.toLowerCase().includes(searchLower) ||
      tarea.proceso?.numero_proceso?.toLowerCase().includes(searchLower) ||
      tarea.proceso?.nombre?.toLowerCase().includes(searchLower);

    const matchEstado =
      filtroEstado === "todos" ||
      tarea.estado?.nombre?.toLowerCase() === filtroEstado.toLowerCase();

    return matchSearch && matchEstado;
  });

  // Estadísticas
  const stats = {
    total: tareas.length,
    pendientes: tareas.filter(
      (t) => t.estado?.nombre?.toLowerCase() === "pendiente"
    ).length,
    enProceso: tareas.filter(
      (t) => t.estado?.nombre?.toLowerCase() === "en proceso"
    ).length,
    completadas: tareas.filter(
      (t) => t.estado?.nombre?.toLowerCase() === "completada"
    ).length,
    vencidas: tareas.filter(
      (t) =>
        t.fecha_vencimiento &&
        estaVencido(t.fecha_vencimiento) &&
        t.estado?.nombre?.toLowerCase() !== "completada"
    ).length,
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-700 border-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "baja":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getEstadoIcon = (estadoNombre) => {
    switch (estadoNombre?.toLowerCase()) {
      case "completada":
        return <CheckCircle2 className="h-4 w-4" />;
      case "en proceso":
        return <Clock className="h-4 w-4" />;
      case "pendiente":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 bg">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Gestiona las tareas de tus procesos legales
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={vistaActual === "tabla" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("tabla")}
              className="rounded-none"
            >
              <Table className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button
              variant={vistaActual === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("cards")}
              className="rounded-none"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
          <Button size="lg" className="gap-2" onClick={handleNuevaTarea}>
            <Plus className="h-5 w-5" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Todas las tareas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Circle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.pendientes}
            </div>
            <p className="text-xs text-muted-foreground">Sin iniciar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.enProceso}
            </div>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completadas}
            </div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.vencidas}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Tareas</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o proceso..."
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
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en proceso">En Proceso</option>
                <option value="completada">Completada</option>
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
                  Cargando tareas...
                </p>
              </div>
            </div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay tareas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron tareas con ese criterio"
                  : "Comienza agregando tu primera tarea"}
              </p>
              {!searchTerm && (
                <Button onClick={handleNuevaTarea}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Tarea
                </Button>
              )}
            </div>
          ) : vistaActual === "tabla" ? (
            <TareasTable
              tareas={tareasFiltradas}
              onUpdate={cargarTareas}
              onTareaClick={handleEditarTarea}
            />
          ) : (
            <div className="space-y-3">
              {tareasFiltradas.map((tarea) => {
                const vencida =
                  tarea.fecha_vencimiento &&
                  estaVencido(tarea.fecha_vencimiento) &&
                  tarea.estado?.nombre?.toLowerCase() !== "completada";

                return (
                  <Card
                    key={tarea.id}
                    className={`hover:shadow-md transition-shadow ${
                      vencida ? "border-red-300 bg-red-50/50" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Estado Icon */}
                        <div
                          className="mt-1 rounded-full p-2"
                          style={{
                            backgroundColor: `${tarea.estado?.color}20`,
                          }}
                        >
                          <div style={{ color: tarea.estado?.color }}>
                            {getEstadoIcon(tarea.estado?.nombre)}
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">{tarea.titulo}</h3>
                              {tarea.descripcion && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {tarea.descripcion}
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
                            {tarea.proceso && (
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{tarea.proceso.numero_proceso}</span>
                              </div>
                            )}
                            {tarea.empleado_asignado && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span>
                                  {tarea.empleado_asignado.nombre}{" "}
                                  {tarea.empleado_asignado.apellido}
                                </span>
                              </div>
                            )}
                            {tarea.fecha_vencimiento && (
                              <div
                                className={`flex items-center gap-1.5 ${
                                  vencida ? "text-red-600 font-medium" : ""
                                }`}
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {formatearFecha(tarea.fecha_vencimiento)}
                                </span>
                                {vencida && (
                                  <AlertCircle className="h-3.5 w-3.5" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Badges y Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                              {tarea.prioridad && (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPrioridadColor(
                                    tarea.prioridad
                                  )}`}
                                >
                                  {tarea.prioridad}
                                </span>
                              )}
                              {tarea.estado && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor: `${tarea.estado.color}20`,
                                    color: tarea.estado.color,
                                  }}
                                >
                                  {getEstadoIcon(tarea.estado.nombre)}
                                  {tarea.estado.nombre}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditarTarea(tarea)}
                              >
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

      <TareaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarea={tareaSeleccionada}
        onSuccess={handleSuccess}
      />

      <TareaPanel
        tarea={tareaSeleccionada}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUpdate={cargarTareas}
      />
    </div>
  );
}
