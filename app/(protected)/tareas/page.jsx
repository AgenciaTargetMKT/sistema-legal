"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

import TareasTable from "@/components/tables/editable/TareasTable";

import TareaPanel from "@/components/tables/editable/TareaPanel";
import {
  DesempenoMensualView,
  PausadasView,
  FinalizadasView,
} from "@/components/features/tareas";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export default function TareasPage() {
  const { empleado } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState("mis-tareas");
  const [panelOpen, setPanelOpen] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState(new Set());

  useEffect(() => {
    cargarTareas();
    cargarEmpleados();
  }, []);

  // ❌ Suscripción removida - TareasTable maneja los cambios en empleados directamente

  // Suscripción en tiempo real SOLO para INSERT de tareas
  // TareasTable maneja los UPDATE para evitar conflictos
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
          console.log("➕ Nueva tarea insertada");
          await cargarTareas(false);
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
      // Solo actualizar si hay cambios reales en los datos
      const hayDiferencias =
        JSON.stringify(tareaActualizada) !== JSON.stringify(tareaSeleccionada);
      if (hayDiferencias) {
        setTareaSeleccionada(tareaActualizada);
      }
    }
  }, [tareas, panelOpen]);

  const cargarTareas = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          empleado_creador_id,
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

      // Debug: Verificar que los datos de empleados_designados llegan correctamente
      if (!showLoading && data && data.length > 0) {
        const tareasConDesignados = data.filter(
          (t) => t.empleados_designados?.length > 0
        );
        console.log(
          "📊 Actualizando tareas - Total con designados:",
          tareasConDesignados.length
        );
        if (tareasConDesignados.length > 0) {
          console.log(
            "✅ Ejemplo de datos empleados_designados:",
            JSON.stringify(tareasConDesignados[0].empleados_designados, null, 2)
          );
        }
      }

      setTareas(data || []);
      console.log("🔄 Total tareas cargadas:", data?.length || 0);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      if (showLoading) {
        toast.error("Error al cargar tareas: " + error.message);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from("empleados")
        .select("id, nombre, apellido")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error("Error cargando empleados:", error);
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
    cargarTareas(false);
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    // 🚫 Filtrar tareas finalizadas (no mostrar en tabla principal)
    const esFinalizada = tarea.estado?.categoria === "completado";
    if (esFinalizada) return false;

    // Filtro por vista
    if (vistaActual === "mis-tareas" && empleado?.id) {
      // Verificar si la tarea pertenece al usuario actual
      const esCreador = tarea.empleado_creador_id === empleado.id;

      const esResponsable =
        Array.isArray(tarea.empleados_responsables) &&
        tarea.empleados_responsables.length > 0 &&
        tarea.empleados_responsables.some((emp) => {
          // Verificar múltiples formas de ID
          const empId = emp?.empleado?.id || emp?.empleado_id;
          return empId === empleado.id;
        });

      const esDesignado =
        Array.isArray(tarea.empleados_designados) &&
        tarea.empleados_designados.length > 0 &&
        tarea.empleados_designados.some((emp) => {
          // Verificar múltiples formas de ID
          const empId = emp?.empleado?.id || emp?.empleado_id || emp?.id;
          return empId === empleado.id;
        });

      const esMiTarea = esCreador || esResponsable || esDesignado;

      // Debug: Log para verificar filtrado
      if (!esMiTarea && tarea.empleados_designados?.length > 0) {
        console.log("🔍 Tarea filtrada:", {
          tareaId: tarea.id,
          empleadoActualId: empleado.id,
          esCreador,
          esResponsable,
          esDesignado,
          empleados_designados: tarea.empleados_designados,
        });
      }

      if (!esMiTarea) return false;
    }

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

  // Función para toggle expandir/colapsar empleado
  const toggleEmpleado = (empleadoId) => {
    setEmpleadosExpandidos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empleadoId)) {
        newSet.delete(empleadoId);
      } else {
        newSet.add(empleadoId);
      }
      return newSet;
    });
  };

  // Obtener tareas de un empleado específico
  const getTareasPorEmpleado = (empleadoId) => {
    return tareasFiltradas.filter((tarea) => {
      const perteneceAlEmpleado =
        tarea.empleado_creador_id === empleadoId ||
        tarea.empleados_responsables?.some(
          (emp) => emp.empleado?.id === empleadoId
        ) ||
        tarea.empleados_designados?.some(
          (emp) => emp.empleado?.id === empleadoId
        );
      return perteneceAlEmpleado;
    });
  };

  // Obtener empleados con tareas (para vista "Todas")
  const getEmpleadosConTareas = () => {
    return empleados
      .map((emp) => ({
        ...emp,
        cantidadTareas: getTareasPorEmpleado(emp.id).length,
      }))
      .filter((emp) => emp.cantidadTareas > 0);
  };

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
              variant={vistaActual === "mis-tareas" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("mis-tareas")}
              className={`rounded-none px-4 whitespace-nowrap ${
                vistaActual === "mis-tareas"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Mis Tareas
            </Button>
            <Button
              variant={vistaActual === "todas" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("todas")}
              className={`rounded-none px-4 ${
                vistaActual === "todas"
                  ? "bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md"
                  : ""
              }`}
            >
              <Table className="h-4 w-4 mr-2" />
              Todas
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

      {/* Search and Filters - Solo mostrar en vista de tabla y mis tareas */}
      {(vistaActual === "mis-tareas" || vistaActual === "todas") && (
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
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg mb-5">
                <Pause className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No hay tareas pausadas
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                Las tareas que se encuentren en pausa aparecerán aquí para su
                seguimiento
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
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mb-5">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No hay tareas finalizadas
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                Las tareas completadas y finalizadas aparecerán aquí para su
                consulta
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
        ) : vistaActual === "mis-tareas" ? (
          tareasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-5">
                <CheckSquare className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No tienes tareas asignadas
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                {searchTerm
                  ? "No se encontraron tareas con ese criterio de búsqueda"
                  : "Las tareas donde eres creador, responsable o designado aparecerán aquí"}
              </p>
            </div>
          ) : (
            <TareasTable
              tareas={tareasFiltradas}
              onUpdate={cargarTareas}
              onTareaClick={handleEditarTarea}
              onTareasChange={setTareas}
            />
          )
        ) : vistaActual === "todas" ? (
          getEmpleadosConTareas().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-gray-50 to-slate-50 rounded-2xl shadow-lg border border-gray-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg mb-5">
                <User className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No hay tareas asignadas
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                {searchTerm
                  ? "No se encontraron tareas con ese criterio de búsqueda"
                  : "Las tareas aparecerán organizadas por empleado cuando sean asignadas"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getEmpleadosConTareas().map((empleado) => {
                const tareasEmpleado = getTareasPorEmpleado(empleado.id);
                const estaExpandido = empleadosExpandidos.has(empleado.id);

                return (
                  <motion.div
                    key={empleado.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-200 overflow-hidden transition-shadow duration-200"
                  >
                    {/* Header del empleado - clickeable para expandir/colapsar */}
                    <button
                      onClick={() => toggleEmpleado(empleado.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{ rotate: estaExpandido ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </motion.div>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">
                              {empleado.nombre?.[0]}
                              {empleado.apellido?.[0]}
                            </span>
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {empleado.nombre} {empleado.apellido}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {empleado.cantidadTareas} tarea
                              {empleado.cantidadTareas !== 1 ? "s" : ""}{" "}
                              asignada{empleado.cantidadTareas !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                          {empleado.cantidadTareas}
                        </span>
                      </div>
                    </button>

                    {/* Contenido expandible - Tabla de tareas */}
                    <AnimatePresence>
                      {estaExpandido && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200 overflow-hidden"
                        >
                          <div className="p-4 bg-gray-50">
                            <TareasTable
                              tareas={tareasEmpleado}
                              onUpdate={cargarTareas}
                              onTareaClick={handleEditarTarea}
                              onTareasChange={setTareas}
                              hideControls={true}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
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
          // Limpiar tareaSeleccionada después de un delay más largo
          setTimeout(() => {
            setTareaSeleccionada(null);
          }, 500);
        }}
        onUpdate={() => cargarTareas(false)}
      />
    </motion.div>
  );
}
