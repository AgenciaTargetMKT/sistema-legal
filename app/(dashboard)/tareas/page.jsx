"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import TareasTable from "@/components/editable-table/TareasTable";
import TareaPanel from "@/components/editable-table/TareaPanel";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
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

  // Suscripción en tiempo real para INSERT de nuevas tareas
  useEffect(() => {
    const channel = supabase
      .channel("tareas-changes-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tareas",
        },
        async (payload) => {
        
          await cargarTareas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sincronizar tareaSeleccionada cuando la tabla se actualiza
  // SOLO si el panel está abierto Y hay una tarea seleccionada (no nueva tarea)
  useEffect(() => {
    // No sincronizar si el panel está cerrado o es una nueva tarea (tareaSeleccionada es null)
    if (!panelOpen || !tareaSeleccionada?.id) {
      return;
    }

    const tareaActualizada = tareas.find((t) => t.id === tareaSeleccionada.id);

    if (tareaActualizada) {
      setTareaSeleccionada(tareaActualizada);
    }
  }, [tareas, panelOpen, tareaSeleccionada?.id]); // IMPORTANTE: incluir panelOpen y tareaSeleccionada?.id

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          proceso:procesos(id, nombre),
          estado:estados_tarea(id, nombre, color, categoria),
          cliente:clientes(id, nombre),
          empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
          empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
        `
        )
        .order("orden", { ascending: true });

      if (error) {
        console.error("❌ Error cargando tareas:", error);
        throw error;
      }

      setTareas(data || []);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      toast.error("Error al cargar tareas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaTarea = () => {
    if (panelOpen) {
      setPanelOpen(false);
      // Esperar a que se cierre antes de abrir con nueva tarea
      setTimeout(() => {
        setTareaSeleccionada(null);
        setPanelOpen(true);
      }, 100);
    } else {
      // Si está cerrado, abrir directamente
      setTareaSeleccionada(null);
      setPanelOpen(true);
    }
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
      tarea.nombre?.toLowerCase().includes(searchLower) ||
      tarea.proceso?.nombre?.toLowerCase().includes(searchLower) ||
      tarea.empleados_responsables?.some(
        (emp) =>
          emp.empleado?.nombre?.toLowerCase().includes(searchLower) ||
          emp.empleado?.apellido?.toLowerCase().includes(searchLower)
      );

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 bg"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex gap-2"
        >
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
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="gap-2" onClick={handleNuevaTarea}>
              <Plus className="h-5 w-5" />
              Nueva Tarea
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          ) : vistaActual === "tabla" ? (
            tareasFiltradas.length === 0 ? (
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
            ) : (
              <TareasTable
                tareas={tareasFiltradas}
                onUpdate={cargarTareas}
                onTareaClick={handleEditarTarea}
                onTareasChange={setTareas}
              />
            )
          ) : (
            <div className="space-y-3">
              {tareasFiltradas.map((tarea, index) => {
                const vencida =
                  tarea.fecha_vencimiento &&
                  estaVencido(tarea.fecha_vencimiento) &&
                  tarea.estado?.nombre?.toLowerCase() !== "completada";

                return (
                  <motion.div
                    key={tarea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                  >
                    <Card
                      className={`hover:shadow-md transition-shadow cursor-pointer ${
                        vencida ? "border-red-300 bg-red-50/50" : ""
                      }`}
                      onClick={() => handleEditarTarea(tarea)}
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
                                <h3 className="font-semibold">
                                  {tarea.titulo}
                                </h3>
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
                                  <span>{tarea.proceso.nombre}</span>
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </motion.div>

      <TareaPanel
        key={
          panelOpen ? tareaSeleccionada?.id || `new-${Date.now()}` : "closed"
        }
        tarea={tareaSeleccionada}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          // Limpiar tareaSeleccionada después de un pequeño delay para que la animación termine
          setTimeout(() => {
            setTareaSeleccionada(null);
          }, 300);
        }}
        onUpdate={cargarTareas}
      />
    </motion.div>
  );
}
