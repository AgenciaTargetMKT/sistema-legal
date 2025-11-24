"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import TareasTable from "@/components/tables/editable/TareasTable";
import TareaPanel from "@/components/tables/editable/TareaPanel";
import {
  DesempenoMensualView,
  PausadasView,
  FinalizadasView,
} from "@/components/features/tareas";
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
  TrendingUp,
  Pause,
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
    // 🚫 Filtrar tareas finalizadas (no mostrar en tabla principal)
    const esFinalizada = tarea.estado?.categoria === "completado";
    if (esFinalizada) return false;

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
              size="default"
              onClick={() => setVistaActual("tabla")}
              className={`rounded-none px-4 ${
                vistaActual === "tabla"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <Table className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button
              variant={vistaActual === "desempeno" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("desempeno")}
              className={`rounded-none px-4 whitespace-nowrap ${
                vistaActual === "desempeno"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Desempeño Mensual
            </Button>
            <Button
              variant={vistaActual === "pausadas" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("pausadas")}
              className={`rounded-none px-4 ${
                vistaActual === "pausadas"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausadas
            </Button>
            <Button
              variant={vistaActual === "finalizadas" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("finalizadas")}
              className={`rounded-none px-4 ${
                vistaActual === "finalizadas"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizadas
            </Button>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white"
              onClick={handleNuevaTarea}
            >
              <Plus className="h-5 w-5" />
              Nueva Tarea
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Search and Filters - Solo mostrar en vista de tabla */}
      {vistaActual === "tabla" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título o proceso..."
                className="pl-10 h-10 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 h-10 border-2 border-gray-300 rounded-xl text-sm font-medium min-w-[180px] whitespace-nowrap focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all bg-white hover:border-primary-400 cursor-pointer"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En Proceso</option>
              <option value="completada">Completada</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-2 hover:bg-primary-50 hover:border-primary-500"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Contenido de las vistas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Cargando tareas...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : vistaActual === "desempeno" ? (
          <DesempenoMensualView />
        ) : vistaActual === "pausadas" ? (
          tareasFiltradas.filter((t) => {
            const estadoNombre = t.estado?.nombre?.toLowerCase() || "";
            return (
              estadoNombre.includes("pausa") || estadoNombre.includes("pausad")
            );
          }).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl shadow-sm border border-gray-200">
              <Pause className="h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                No hay tareas pausadas
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Las tareas pausadas aparecerán aquí
              </p>
            </div>
          ) : (
            <TareasTable
              tareas={tareasFiltradas.filter((t) => {
                const estadoNombre = t.estado?.nombre?.toLowerCase() || "";
                return (
                  estadoNombre.includes("pausa") ||
                  estadoNombre.includes("pausad")
                );
              })}
              onUpdate={cargarTareas}
              onTareaClick={handleEditarTarea}
              onTareasChange={setTareas}
            />
          )
        ) : vistaActual === "finalizadas" ? (
          tareas.filter((t) => t.estado?.categoria === "completado").length ===
          0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl shadow-sm border border-gray-200">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                No hay tareas finalizadas
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Las tareas completadas aparecerán aquí
              </p>
            </div>
          ) : (
            <TareasTable
              tareas={tareas.filter(
                (t) => t.estado?.categoria === "completado"
              )}
              onUpdate={cargarTareas}
              onTareaClick={handleEditarTarea}
              onTareasChange={setTareas}
            />
          )
        ) : vistaActual === "tabla" ? (
          tareasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl shadow-sm border border-gray-200">
              <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                No hay tareas
              </h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                {searchTerm
                  ? "No se encontraron tareas con ese criterio"
                  : "Comienza agregando tu primera tarea"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleNuevaTarea}
                  className="bg-primary-600 hover:bg-primary-700"
                >
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
        ) : null}
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
