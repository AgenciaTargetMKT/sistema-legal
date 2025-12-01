"use client";

import { useState, useEffect, useMemo } from "react";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTareas, useEmpleados, useEstadosTarea } from "@/hooks/useTareas";

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

  // 🔥 HOOKS OPTIMIZADOS: Caché + Realtime
  const { data: tareas = [], isLoading: loading, refetch } = useTareas();
  const { data: empleados = [] } = useEmpleados();
  const { data: estadosTarea = [] } = useEstadosTarea();

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroImportancia, setFiltroImportancia] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState("mis-tareas");
  const [panelOpen, setPanelOpen] = useState(false);
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState(new Set());

  // Sincronizar tareaSeleccionada cuando la tabla se actualiza
  useEffect(() => {
    if (!panelOpen || !tareaSeleccionada?.id) return;

    const tareaActualizada = tareas.find((t) => t.id === tareaSeleccionada.id);
    if (tareaActualizada) {
      const hayDiferencias =
        JSON.stringify(tareaActualizada) !== JSON.stringify(tareaSeleccionada);
      if (hayDiferencias) {
        setTareaSeleccionada(tareaActualizada);
      }
    }
  }, [tareas, panelOpen, tareaSeleccionada]);

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
    refetch();
  };

  // 🚀 MEMOIZAR FILTRADO DE TAREAS (optimización)
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((tarea) => {
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
        }

        if (!esMiTarea) return false;
      }

      // Filtrar por vistas específicas
      if (vistaActual === "proximos-5-dias") {
        if (!tarea.fecha_vencimiento) return false;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const hace5Dias = new Date();
        hace5Dias.setDate(hace5Dias.getDate() - 5);
        hace5Dias.setHours(0, 0, 0, 0);

        const fechaVencimiento = new Date(tarea.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);

        const dentroDelRango =
          fechaVencimiento >= hace5Dias && fechaVencimiento <= hoy;

        if (!dentroDelRango) return false;
      }

      if (vistaActual === "retrasadas") {
        if (!tarea.fecha_vencimiento) return false;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaVencimiento = new Date(tarea.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);

        const estaRetrasada = fechaVencimiento < hoy;
        const noCompletada = tarea.estado?.categoria !== "completado";

        if (!estaRetrasada || !noCompletada) return false;
      }

      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        tarea.nombre?.toLowerCase().includes(searchLower) ||
        tarea.proceso?.toLowerCase().includes(searchLower) ||
        tarea.empleados_responsables?.some(
          (emp) =>
            emp.empleado?.nombre?.toLowerCase().includes(searchLower) ||
            emp.empleado?.apellido?.toLowerCase().includes(searchLower)
        );

      const matchEstado =
        filtroEstado === "todos" || tarea.estado_id === filtroEstado;

      // Filtro por Importancia
      const matchImportancia =
        filtroImportancia === "todos" ||
        tarea.importancia?.toLowerCase() === filtroImportancia.toLowerCase();

      // Filtro por Urgencia
      const matchUrgencia =
        filtroUrgencia === "todos" ||
        tarea.urgencia?.toLowerCase() === filtroUrgencia.toLowerCase();

      return matchSearch && matchEstado && matchImportancia && matchUrgencia;
    });
  }, [
    tareas,
    vistaActual,
    empleado,
    searchTerm,
    filtroEstado,
    filtroImportancia,
    filtroUrgencia,
  ]);

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
              variant={vistaActual === "proximos-5-dias" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("proximos-5-dias")}
              className={`rounded-none px-4 whitespace-nowrap ${
                vistaActual === "proximos-5-dias"
                  ? "bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                  : ""
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Hoy
            </Button>
            <Button
              variant={vistaActual === "retrasadas" ? "default" : "ghost"}
              size="default"
              onClick={() => setVistaActual("retrasadas")}
              className={`rounded-none px-4 whitespace-nowrap ${
                vistaActual === "retrasadas"
                  ? "bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
                  : ""
              }`}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Retrasadas
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

      {/* Search and Filters - Solo mostrar en vistas de tabla */}
      {(vistaActual === "mis-tareas" ||
        vistaActual === "todas" ||
        vistaActual === "proximos-5-dias" ||
        vistaActual === "retrasadas") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título o proceso..."
                className="pl-10 h-10 rounded-xl border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro de Estado */}
            <select
              className="px-4 h-10 border-2 border-gray-300 rounded-xl text-sm font-medium min-w-[200px] whitespace-nowrap focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all bg-white hover:border-primary-400 cursor-pointer"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {(() => {
                // Agrupar estados por su categoría
                const categorias = estadosTarea.reduce((acc, estado) => {
                  const cat = estado.categoria || "sin-categoria";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(estado);
                  return acc;
                }, {});

                // Mapeo de categorías a etiquetas
                const categoriasConfig = {
                  pendiente: { label: "Pendientes", orden: 1 },
                  "en-proceso": { label: "En proceso", orden: 2 },
                  pausado: { label: "Pausadas", orden: 3 },
                  completado: { label: "Completadas", orden: 4 },
                  importante: { label: "Importante", orden: 5 },
                  urgente: { label: "Urgente", orden: 6 },
                  "no-urgente": { label: "No urgente", orden: 7 },
                  "sin-categoria": { label: "Otros", orden: 99 },
                };

                // Ordenar categorías
                const categoriasOrdenadas = Object.entries(categorias).sort(
                  ([catA], [catB]) => {
                    const ordenA = categoriasConfig[catA]?.orden || 99;
                    const ordenB = categoriasConfig[catB]?.orden || 99;
                    return ordenA - ordenB;
                  }
                );

                return categoriasOrdenadas.map(([categoria, estados]) => {
                  const config = categoriasConfig[categoria] || {
                    label: categoria,
                  };
                  return (
                    <optgroup key={categoria} label={config.label}>
                      {estados
                        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                        .map((estado) => (
                          <option key={estado.id} value={estado.id}>
                            {estado.descripcion || estado.nombre}
                          </option>
                        ))}
                    </optgroup>
                  );
                });
              })()}
            </select>

            {/* Filtro de Importancia */}
            <select
              className="px-4 h-10 border-2 border-gray-300 rounded-xl text-sm font-medium min-w-[180px] whitespace-nowrap focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all bg-white hover:border-primary-400 cursor-pointer"
              value={filtroImportancia}
              onChange={(e) => setFiltroImportancia(e.target.value)}
            >
              <option value="todos">Importancia</option>
              <option value="importante">Importante</option>
              <option value="no importante">No importante</option>
            </select>

            {/* Filtro de Urgencia */}
            <select
              className="px-4 h-10 border-2 border-gray-300 rounded-xl text-sm font-medium min-w-[180px] whitespace-nowrap focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all bg-white hover:border-primary-400 cursor-pointer"
              value={filtroUrgencia}
              onChange={(e) => setFiltroUrgencia(e.target.value)}
            >
              <option value="todos">Urgencia</option>
              <option value="urgente">Urgente</option>
              <option value="no urgente">No urgente</option>
            </select>

            {/* Información de resultados - Ocultar en vista proximos-5-dias */}
            {vistaActual !== "proximos-5-dias" && (
              <div className="text-sm text-gray-600 font-medium">
                {tareasFiltradas.length}{" "}
                {tareasFiltradas.length === 1 ? "tarea" : "tareas"}
              </div>
            )}
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
              onUpdate={refetch}
              onTareaClick={handleEditarTarea}
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
              onUpdate={refetch}
              onTareaClick={handleEditarTarea}
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
              onUpdate={refetch}
              onTareaClick={handleEditarTarea}
            />
          )
        ) : vistaActual === "proximos-5-dias" ? (
          getEmpleadosConTareas().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg mb-5">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                No hay tareas en los últimos 5 días
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                Las tareas con vencimiento de los últimos 5 días aparecerán aquí
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
                            <h3 className="font-bold text-gray-900 text-base">
                              {empleado.nombre} {empleado.apellido}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              {tareasEmpleado.length}{" "}
                              {tareasEmpleado.length === 1
                                ? "tarea asignada"
                                : "tareas asignadas"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shadow-sm">
                          {tareasEmpleado.length}
                        </div>
                      </div>
                    </button>

                    {/* Contenido expandible - Tabla de tareas */}
                    <AnimatePresence>
                      {estaExpandido && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-gray-200 bg-gray-50/50">
                            <TareasTable
                              tareas={tareasEmpleado}
                              onUpdate={refetch}
                              onTareaClick={handleEditarTarea}
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
        ) : vistaActual === "retrasadas" ? (
          tareasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mb-5">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ¡No hay tareas retrasadas!
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md">
                Todas las tareas están al día. Las tareas vencidas y no
                completadas aparecerán aquí
              </p>
            </div>
          ) : (
            <TareasTable
              tareas={tareasFiltradas}
              onUpdate={refetch}
              onTareaClick={handleEditarTarea}
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
                              onUpdate={refetch}
                              onTareaClick={handleEditarTarea}
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
        onUpdate={refetch}
      />
    </motion.div>
  );
}
