"use client";

import { useState, useEffect, useMemo } from "react";
import { formatearFecha, estaVencido } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Table,
  TrendingUp,
  Pause,
  ChevronRight,
  ListFilter,
  LayoutList,
  Check,
} from "lucide-react";

export default function TareasPage() {
  const { empleado } = useAuth();

  // 🔥 HOOKS OPTIMIZADOS: Caché + Realtime
  const { data: tareas = [], isLoading: loading, refetch } = useTareas();
  const { data: empleados = [] } = useEmpleados();
  const { data: estadosTarea = [] } = useEstadosTarea();

  // Estado para controlar si ya se cargó el empleado (evitar parpadeo)
  const [empleadoListo, setEmpleadoListo] = useState(false);

  // Marcar cuando el empleado está listo
  useEffect(() => {
    if (empleado?.id) {
      setEmpleadoListo(true);
    }
  }, [empleado?.id]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroImportancia, setFiltroImportancia] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState("mis-tareas");
  const [panelOpen, setPanelOpen] = useState(false);
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState(new Set());
  const [openEstado, setOpenEstado] = useState(false);

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
    setTareaSeleccionada(null);
    setPanelOpen(true);
  };

  const handleEditarTarea = (tarea) => {
    setTareaSeleccionada(tarea);
    setPanelOpen(true);
  };

  // 🚀 MEMOIZAR FILTRADO DE TAREAS (optimización)
  const tareasFiltradas = useMemo(() => {
    // Si no hay empleado en vista "mis-tareas", retornar vacío
    if (vistaActual === "mis-tareas" && !empleado?.id) {
      return [];
    }

    return tareas.filter((tarea) => {
      // 🚫 Filtrar tareas finalizadas (no mostrar en tabla principal)
      const esFinalizada = tarea.estado?.categoria === "completado";
      if (esFinalizada) return false;

      // Filtro por vista "Mis Tareas"
      if (vistaActual === "mis-tareas") {
        const miId = empleado.id;

        // Verificar si soy el creador
        const esCreador = tarea.empleado_creador_id === miId;

        // Verificar si soy responsable (manejar diferentes estructuras de datos)
        const esResponsable =
          Array.isArray(tarea.empleados_responsables) &&
          tarea.empleados_responsables.some((item) => {
            // La estructura puede ser: { empleado: { id } } o { empleado_id } o { id }
            const empId = item?.empleado?.id || item?.empleado_id || item?.id;
            return empId === miId;
          });

        // Verificar si soy designado (manejar diferentes estructuras de datos)
        const esDesignado =
          Array.isArray(tarea.empleados_designados) &&
          tarea.empleados_designados.some((item) => {
            // La estructura puede ser: { empleado: { id } } o { empleado_id } o { id }
            const empId = item?.empleado?.id || item?.empleado_id || item?.id;
            return empId === miId;
          });

        // 🔒 Solo mostrar si estoy involucrado de alguna forma
        if (!esCreador && !esResponsable && !esDesignado) {
          return false;
        }
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
        if (!(fechaVencimiento >= hace5Dias && fechaVencimiento <= hoy))
          return false;
      }

      if (vistaActual === "retrasadas") {
        if (!tarea.fecha_vencimiento) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaVencimiento = new Date(tarea.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (
          !(fechaVencimiento < hoy && tarea.estado?.categoria !== "completado")
        )
          return false;
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
        filtroEstado === "todos" || tarea.estado_id === filtroEstado;
      const matchImportancia =
        filtroImportancia === "todos" ||
        tarea.importancia?.toLowerCase() === filtroImportancia.toLowerCase();
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

  const getTareasPorEmpleado = (empleadoId) => {
    return tareasFiltradas.filter((tarea) => {
      return (
        tarea.empleado_creador_id === empleadoId ||
        tarea.empleados_responsables?.some(
          (emp) => emp.empleado?.id === empleadoId
        ) ||
        tarea.empleados_designados?.some(
          (emp) => emp.empleado?.id === empleadoId
        )
      );
    });
  };

  const getEmpleadosConTareas = () => {
    return empleados
      .map((emp) => ({
        ...emp,
        cantidadTareas: getTareasPorEmpleado(emp.id).length,
      }))
      .filter((emp) => emp.cantidadTareas > 0);
  };

  // Configuración de tabs con labels cortos para móvil
  const tabs = [
    {
      id: "mis-tareas",
      label: "Mis Tareas",
      shortLabel: "Mías",
      icon: User,
      count: tareasFiltradas.length,
    },
    { id: "todas", label: "Todas", shortLabel: "Todas", icon: Table },
    { id: "proximos-5-dias", label: "Hoy", shortLabel: "Hoy", icon: Calendar },
    {
      id: "retrasadas",
      label: "Retrasadas",
      shortLabel: "Retrasadas",
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      id: "desempeno",
      label: "Desempeño Mensual",
      shortLabel: "Desempeño",
      icon: TrendingUp,
    },
    { id: "pausadas", label: "Pausadas", shortLabel: "Pausadas", icon: Pause },
    {
      id: "finalizadas",
      label: "Finalizadas",
      shortLabel: "Finalizadas",
      icon: CheckCircle2,
    },
  ];

  const mostrarFiltros = [
    "mis-tareas",
    "todas",
    "proximos-5-dias",
    "retrasadas",
  ].includes(vistaActual);

  return (
    <div className="min-h-full">
      {/* Contenedor con bordes redondeados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header con tabs */}
        <div className="border-b border-gray-100 rounded-t-xl">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Tabs y botón nueva tarea */}
            <div className="flex items-center gap-3">
              {/* Contenedor de tabs con scroll horizontal */}
              <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1 bg-gray-200/90 p-1 rounded-xl w-max min-w-full sm:min-w-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = vistaActual === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setVistaActual(tab.id)}
                        className={`
                        flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${
                          isActive
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }
                      `}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${tab.color || ""}`}
                        />
                        <span className="sm:hidden">{tab.shortLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== undefined && isActive && (
                          <span className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón nueva tarea - siempre visible */}
              <Button
                onClick={handleNuevaTarea}
                className="bg-linear-to-br from-blue-500 to-blue-600 hover:bg-primary-700 text-white gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-md shadow-lg shadow-primary-600/20 transition-all hover:shadow-xl hover:shadow-primary-600/30 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Tarea</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de filtros */}
        {mostrarFiltros && (
          <div className="bg-white border-b border-gray-100 px-6 py-3">
            <div className="flex items-center gap-4">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tareas..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="h-6 w-px bg-gray-200" />

              {/* Filtros como pills */}
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-gray-400" />

                <Popover open={openEstado} onOpenChange={setOpenEstado}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEstado}
                      className="justify-between h-9 border-0 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg px-3 py-2 text-sm transition-all"
                    >
                      <span>
                        {filtroEstado !== "todos"
                          ? estadosTarea
                              .find((e) => e.id === filtroEstado)
                              ?.nombre?.charAt(0)
                              .toUpperCase() +
                            estadosTarea
                              .find((e) => e.id === filtroEstado)
                              ?.nombre?.slice(1)
                              .replace(/_/g, " ")
                          : "Estado"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-0" align="start">
                    <Command>
                      <CommandList className="max-h-[400px]">
                        <CommandGroup>
                          <CommandItem
                            value="todos"
                            onSelect={() => {
                              setFiltroEstado("todos");
                              setOpenEstado(false);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filtroEstado === "todos"
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            Todos los estados
                          </CommandItem>
                        </CommandGroup>

                        {/* PENDIENTE */}
                        <CommandGroup
                          heading="PENDIENTE"
                          className="text-xs text-gray-500 font-semibold"
                        >
                          {estadosTarea
                            .filter((e) => e.categoria === "pendiente")
                            .sort(
                              (a, b) => parseInt(a.orden) - parseInt(b.orden)
                            )
                            .map((estado) => (
                              <CommandItem
                                key={estado.id}
                                value={estado.nombre}
                                onSelect={() => {
                                  setFiltroEstado(estado.id);
                                  setOpenEstado(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: estado.color }}
                                  />
                                  <span className="capitalize text-sm">
                                    {estado.nombre.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    filtroEstado === estado.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>

                        {/* EN CURSO */}
                        <CommandGroup
                          heading="EN CURSO"
                          className="text-xs text-gray-500 font-semibold"
                        >
                          {estadosTarea
                            .filter((e) => e.categoria === "en_curso")
                            .sort(
                              (a, b) => parseInt(a.orden) - parseInt(b.orden)
                            )
                            .map((estado) => (
                              <CommandItem
                                key={estado.id}
                                value={estado.nombre}
                                onSelect={() => {
                                  setFiltroEstado(estado.id);
                                  setOpenEstado(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: estado.color }}
                                  />
                                  <span className="capitalize text-sm">
                                    {estado.nombre.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    filtroEstado === estado.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>

                        {/* COMPLETADO */}
                        <CommandGroup
                          heading="COMPLETADO"
                          className="text-xs text-gray-500 font-semibold"
                        >
                          {estadosTarea
                            .filter((e) => e.categoria === "completado")
                            .sort(
                              (a, b) => parseInt(a.orden) - parseInt(b.orden)
                            )
                            .map((estado) => (
                              <CommandItem
                                key={estado.id}
                                value={estado.nombre}
                                onSelect={() => {
                                  setFiltroEstado(estado.id);
                                  setOpenEstado(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: estado.color }}
                                  />
                                  <span className="capitalize text-sm">
                                    {estado.nombre.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    filtroEstado === estado.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <select
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-gray-100 transition-all"
                  value={filtroImportancia}
                  onChange={(e) => setFiltroImportancia(e.target.value)}
                >
                  <option value="todos">Importancia</option>
                  <option value="importante">Importante</option>
                  <option value="no importante">No importante</option>
                </select>

                <select
                  className="px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-gray-100 transition-all"
                  value={filtroUrgencia}
                  onChange={(e) => setFiltroUrgencia(e.target.value)}
                >
                  <option value="todos">Urgencia</option>
                  <option value="urgente">Urgente</option>
                  <option value="no urgente">No urgente</option>
                </select>
              </div>

              <div className="ml-auto">
                <span className="text-sm text-gray-500">
                  {tareasFiltradas.length}{" "}
                  {tareasFiltradas.length === 1 ? "tarea" : "tareas"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading || (vistaActual === "mis-tareas" && !empleadoListo) ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Cargando tareas...</p>
                </div>
              </motion.div>
            ) : vistaActual === "desempeno" ? (
              <motion.div
                key="desempeno"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DesempenoMensualView />
              </motion.div>
            ) : vistaActual === "pausadas" ? (
              <motion.div
                key="pausadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.filter((t) =>
                  t.estado?.nombre?.toLowerCase().includes("pausa")
                ).length === 0 ? (
                  <EmptyState
                    icon={Pause}
                    title="No hay tareas pausadas"
                    description="Las tareas en pausa aparecerán aquí"
                    color="yellow"
                  />
                ) : (
                  <TareasTable
                    tareas={tareasFiltradas.filter((t) =>
                      t.estado?.nombre?.toLowerCase().includes("pausa")
                    )}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "finalizadas" ? (
              <motion.div
                key="finalizadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareas.filter((t) => t.estado?.categoria === "completado")
                  .length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No hay tareas finalizadas"
                    description="Las tareas completadas aparecerán aquí"
                    color="green"
                  />
                ) : (
                  <TareasTable
                    tareas={tareas.filter(
                      (t) => t.estado?.categoria === "completado"
                    )}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "mis-tareas" ? (
              <motion.div
                key="mis-tareas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="No tienes tareas asignadas"
                    description={
                      searchTerm
                        ? "No se encontraron tareas"
                        : "Las tareas donde eres responsable o designado aparecerán aquí"
                    }
                    color="blue"
                  />
                ) : (
                  <TareasTable
                    tareas={tareasFiltradas}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "retrasadas" ? (
              <motion.div
                key="retrasadas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {tareasFiltradas.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="¡No hay tareas retrasadas!"
                    description="Todas las tareas están al día"
                    color="green"
                  />
                ) : (
                  <TareasTable
                    tareas={tareasFiltradas}
                    onUpdate={refetch}
                    onTareaClick={handleEditarTarea}
                  />
                )}
              </motion.div>
            ) : vistaActual === "todas" || vistaActual === "proximos-5-dias" ? (
              <motion.div
                key={vistaActual}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {getEmpleadosConTareas().length === 0 ? (
                  <EmptyState
                    icon={User}
                    title="No hay tareas"
                    description={
                      searchTerm
                        ? "No se encontraron tareas"
                        : "Las tareas aparecerán organizadas por empleado"
                    }
                    color="gray"
                  />
                ) : (
                  <div className="space-y-3 relative z-0">
                    {getEmpleadosConTareas().map((emp) => {
                      const tareasEmpleado = getTareasPorEmpleado(emp.id);
                      const estaExpandido = empleadosExpandidos.has(emp.id);

                      return (
                        <div
                          key={emp.id}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative z-0"
                        >
                          <button
                            onClick={() => toggleEmpleado(emp.id)}
                            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <motion.div
                                animate={{ rotate: estaExpandido ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </motion.div>
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {emp.nombre?.[0]}
                                  {emp.apellido?.[0]}
                                </span>
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-gray-900">
                                  {emp.nombre} {emp.apellido}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {tareasEmpleado.length}{" "}
                                  {tareasEmpleado.length === 1
                                    ? "tarea"
                                    : "tareas"}
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-primary-50 text-primary-700 text-sm font-semibold rounded-full">
                              {tareasEmpleado.length}
                            </span>
                          </button>

                          <AnimatePresence>
                            {estaExpandido && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-gray-100 overflow-hidden"
                              >
                                <TareasTable
                                  tareas={tareasEmpleado}
                                  onUpdate={refetch}
                                  onTareaClick={handleEditarTarea}
                                  hideControls={true}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <TareaPanel
        key={
          panelOpen ? tareaSeleccionada?.id || `new-${Date.now()}` : "closed"
        }
        tarea={tareaSeleccionada}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setTareaSeleccionada(null);
        }}
        onUpdate={refetch}
      />
    </div>
  );
}

// Componente Empty State minimalista
function EmptyState({ icon: Icon, title, description, color = "gray" }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-400 to-orange-500",
    gray: "from-gray-400 to-gray-500",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className={`w-16 h-16 rounded-2xl bg-linear-to-br ${colors[color]} flex items-center justify-center mb-5 shadow-lg`}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}
