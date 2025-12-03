"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import ProcesosTable from "@/components/tables/editable/ProcesosTable";
import ProcesoPanel from "@/components/tables/editable/ProcesoPanel";
import EstadisticasProcesos from "@/components/features/procesos/EstadisticasProcesos";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  Briefcase,
  Building2,
  ListFilter,
  Check,
  BarChart3,
} from "lucide-react";
import { formatearFecha, cn } from "@/lib/utils";

export default function ProcesosPage() {
  const [procesos, setProcesos] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [estadosProceso, setEstadosProceso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [vistaActual, setVistaActual] = useState("todos"); // 'todos', 'judiciales', 'administrativos', 'estadisticas'
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [openEstado, setOpenEstado] = useState(false);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tareaDialogOpen, setTareaDialogOpen] = useState(false);
  const [tareaInicial, setTareaInicial] = useState(null);
  const [procesoDialogOpen, setProcesoDialogOpen] = useState(false);
  const [procesoEditar, setProcesoEditar] = useState(null);

  useEffect(() => {
    cargarProcesos();
    cargarTiposProceso();
    cargarEstadosProceso();
  }, []);

  const cargarTiposProceso = async () => {
    try {
      const { data, error } = await supabase
        .from("tipos_proceso")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setTiposProceso(data || []);
    } catch (error) {
      console.error("Error al cargar tipos de proceso:", error);
    }
  };

  const cargarEstadosProceso = async () => {
    try {
      const { data, error } = await supabase
        .from("estados_proceso")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setEstadosProceso(data || []);
    } catch (error) {
      console.error("Error al cargar estados de proceso:", error);
    }
  };

  // Sincronizar procesoSeleccionado cuando la tabla se actualiza via realtime
  useEffect(() => {
    if (!panelOpen || !procesoSeleccionado?.id) return;

    const procesoActualizado = procesos.find(
      (p) => p.id === procesoSeleccionado.id
    );
    if (procesoActualizado) {
      const hayDiferencias =
        JSON.stringify(procesoActualizado) !==
        JSON.stringify(procesoSeleccionado);
      if (hayDiferencias) {
        setProcesoSeleccionado(procesoActualizado);
      }
    }
  }, [procesos, panelOpen, procesoSeleccionado]);

  const cargarProcesos = async () => {
    try {
      setLoading(true);

      // Intentar ordenar por 'orden', si falla usar 'created_at'
      let query = supabase.from("procesos").select(
        `
          *,
          cliente:clientes(nombre, documento_identidad),
          rol_cliente:rol_cliente_id(nombre, color),
          materia:materias(nombre, color),
          estado:estados_proceso(nombre, color),
          tipo_proceso:tipos_proceso(nombre, color),
          lugar_data:lugar(nombre),
          empleados_asignados:proceso_empleados(
            rol,
            empleado:empleados(nombre, apellido)
          )
        `
      );

      // Intentar ordenar por 'orden' primero
      const { data, error } = await query.order("orden", { ascending: true });

      if (error) {
        // Si falla por la columna 'orden', intentar con 'created_at'
        if (error.code === "42703") {
          console.warn(
            "⚠️ La columna 'orden' no existe. Usando 'created_at' como alternativa."
          );
          console.warn(
            "👉 Ejecuta el script: supabase/add_orden_to_procesos.sql"
          );

          const { data: dataAlt, error: errorAlt } = await supabase
            .from("procesos")
            .select(
              `
              *,
              cliente:clientes(nombre, documento_identidad),
              rol_cliente:rol_cliente_id(nombre),
              materia:materias(nombre),
              estado:estados_proceso(nombre, color),
              tipo_proceso:tipos_proceso(nombre),
              lugar_data:lugar(nombre),
              empleados_asignados:proceso_empleados(
                rol,
                empleado:empleados(nombre, apellido)
              )
            `
            )
            .order("created_at", { ascending: true });

          if (errorAlt) throw errorAlt;

          // Cargar actualizaciones por separado
          const procesosConActualizaciones = await cargarActualizaciones(
            dataAlt || []
          );
          setProcesos(procesosConActualizaciones);
          return;
        }
        throw error;
      }

      // Cargar actualizaciones por separado
      const procesosConActualizaciones = await cargarActualizaciones(
        data || []
      );
      setProcesos(procesosConActualizaciones);
    } catch (error) {
      console.error("Error al cargar procesos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarActualizaciones = async (procesos) => {
    if (procesos.length === 0) return procesos;

    // Obtener IDs de procesos
    const procesoIds = procesos.map((p) => p.id);

    // Consultar el último comentario de cada proceso
    const { data: comentarios, error } = await supabase
      .from("comentarios")
      .select("id, proceso_id, contenido, created_at")
      .in("proceso_id", procesoIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error cargando comentarios:", error);
      return procesos;
    }

    // Crear un mapa con el último comentario de cada proceso
    const comentariosPorProceso = {};
    comentarios?.forEach((com) => {
      // Solo guardar el primero (más reciente) de cada proceso
      if (!comentariosPorProceso[com.proceso_id]) {
        comentariosPorProceso[com.proceso_id] = {
          descripcion: com.contenido,
          fecha_actualizacion: com.created_at,
        };
      }
    });

    // Fusionar datos y transformar empleados
    const procesosConActualizaciones = procesos.map((proceso) => ({
      ...proceso,
      ultima_actualizacion: comentariosPorProceso[proceso.id] || null,
      empleados_asignados:
        proceso.empleados_asignados?.map((pe) => pe.empleado) || [],
    }));

    return procesosConActualizaciones;
  };

  const handleProcesoClick = (proceso) => {
    setProcesoSeleccionado(proceso);
    setPanelOpen(true);
  };

  const handleNuevaTarea = (proceso) => {
    setTareaInicial({ proceso_id: proceso?.id });
    setTareaDialogOpen(true);
  };

  const handleTareaSuccess = () => {
    cargarProcesos();
  };

  const handleNuevoProceso = () => {
    // Crear un proceso vacío para el panel
    setProcesoSeleccionado({
      id: null,
      numero_proceso: "",
      nombre: "",
      descripcion: "",
      cliente_id: null,
      materia_id: null,
      estado_id: null,
      tipo_proceso_id: null,
      fecha_inicio: new Date().toISOString().split("T")[0],
      observaciones: "",
    });
    setPanelOpen(true);
  };

  const handleEditarProceso = (proceso) => {
    setProcesoEditar(proceso);
    setProcesoDialogOpen(true);
  };

  const handleEliminarProceso = async (proceso) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el proceso "${proceso.numero_proceso}"?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("procesos")
        .delete()
        .eq("id", proceso.id);

      if (error) throw error;

      cargarProcesos();
    } catch (error) {
      console.error("Error al eliminar proceso:", error);
      alert("Error al eliminar el proceso: " + error.message);
    }
  };

  const handleProcesoSuccess = () => {
    cargarProcesos();
    setProcesoDialogOpen(false);
    setProcesoEditar(null);
  };

  // Filtrar procesos por vista, estado y búsqueda
  const procesosFiltrados = useMemo(() => {
    return procesos.filter((proceso) => {
      // Filtro por vista
      if (vistaActual === "judiciales") {
        const esJudicial =
          proceso.tipo_proceso?.nombre?.toLowerCase().includes("judicial") ||
          proceso.tipo_proceso?.nombre?.toLowerCase().includes("juicio");
        if (!esJudicial) return false;
      } else if (vistaActual === "administrativos") {
        const esAdministrativo = proceso.tipo_proceso?.nombre
          ?.toLowerCase()
          .includes("administrativo");
        if (!esAdministrativo) return false;
      } else if (vistaActual === "estadisticas") {
        // Vista de estadísticas, mostrar todos
        return true;
      }

      // Filtro por estado
      if (filtroEstado !== "todos") {
        if (proceso.estado_id !== filtroEstado) return false;
      }

      // Filtro por búsqueda
      const searchLower = searchTerm.toLowerCase();
      return (
        proceso.numero_proceso?.toLowerCase().includes(searchLower) ||
        proceso.nombre?.toLowerCase().includes(searchLower) ||
        proceso.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        proceso.tipo_proceso?.nombre?.toLowerCase().includes(searchLower) ||
        proceso.estado?.nombre?.toLowerCase().includes(searchLower)
      );
    });
  }, [procesos, vistaActual, filtroEstado, searchTerm]);

  // Contar procesos por tipo
  const contarPorTipo = (tipo) => {
    if (tipo === "todos") return procesos.length;
    if (tipo === "judiciales") {
      return procesos.filter(
        (p) =>
          p.tipo_proceso?.nombre?.toLowerCase().includes("judicial") ||
          p.tipo_proceso?.nombre?.toLowerCase().includes("juicio")
      ).length;
    }
    if (tipo === "administrativos") {
      return procesos.filter((p) =>
        p.tipo_proceso?.nombre?.toLowerCase().includes("administrativo")
      ).length;
    }
    return 0;
  };

  // Configuración de tabs
  const tabs = [
    {
      id: "todos",
      label: "Todos",
      icon: Scale,
      count: contarPorTipo("todos"),
    },
    {
      id: "judiciales",
      label: "Procesos Judiciales",
      shortLabel: "Judiciales",
      icon: Briefcase,
      count: contarPorTipo("judiciales"),
    },
    {
      id: "administrativos",
      label: "Procesos Administrativos",
      shortLabel: "Administrativos",
      icon: Building2,
      count: contarPorTipo("administrativos"),
    },
    {
      id: "estadisticas",
      label: "Estadísticas",
      shortLabel: "Gráficos",
      icon: BarChart3,
    },
  ];

  const mostrarFiltros = ["todos", "judiciales", "administrativos"].includes(
    vistaActual
  );

  return (
    <div className="min-h-full">
      {/* Contenedor con bordes redondeados */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header con tabs */}
        <div className="border-b border-gray-100 dark:border-gray-800 rounded-t-xl">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {/* Tabs y botón nuevo proceso */}
            <div className="flex items-center gap-3">
              {/* Contenedor de tabs con scroll horizontal */}
              <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1 bg-gray-200/90 dark:bg-gray-800 p-1 rounded-xl w-max min-w-full sm:min-w-0">
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
                            ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }
                      `}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="sm:hidden">
                          {tab.shortLabel || tab.label}
                        </span>
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

              {/* Botón nuevo proceso - siempre visible */}
              <Button
                onClick={handleNuevoProceso}
                className="bg-linear-to-br from-blue-500 to-blue-600 hover:bg-primary-700 text-white gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-md shadow-lg shadow-primary-600/20 transition-all hover:shadow-xl hover:shadow-primary-600/30 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Proceso</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        {mostrarFiltros && (
          <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3">
            <div className="flex items-center gap-4">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar procesos..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

              {/* Filtros como pills */}
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-gray-400 dark:text-gray-500" />

                {/* Filtro por Estado */}
                <Popover open={openEstado} onOpenChange={setOpenEstado}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                        filtroEstado !== "todos"
                          ? "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                      )}
                    >
                      {filtroEstado === "todos"
                        ? "Estado"
                        : estadosProceso.find((e) => e.id === filtroEstado)
                            ?.nombre || "Estado"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFiltroEstado("todos");
                              setOpenEstado(false);
                            }}
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
                          {estadosProceso.map((estado) => (
                            <CommandItem
                              key={estado.id}
                              onSelect={() => {
                                setFiltroEstado(estado.id);
                                setOpenEstado(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filtroEstado === estado.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2">
                                {estado.color && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: estado.color }}
                                  />
                                )}
                                <span>{estado.nombre}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="ml-auto">
                <span className="text-sm text-gray-500">
                  {procesosFiltrados.length}{" "}
                  {procesosFiltrados.length === 1 ? "proceso" : "procesos"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Cargando procesos...</p>
                </div>
              </motion.div>
            ) : vistaActual === "estadisticas" ? (
              <motion.div
                key="estadisticas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <EstadisticasProcesos
                  procesos={procesos}
                  estados={estadosProceso}
                />
              </motion.div>
            ) : procesosFiltrados.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={Scale}
                  title={
                    searchTerm || filtroEstado !== "todos"
                      ? "No se encontraron procesos"
                      : "No hay procesos"
                  }
                  description={
                    searchTerm || filtroEstado !== "todos"
                      ? "Intenta con otro término de búsqueda o filtro"
                      : vistaActual === "judiciales"
                      ? "No hay procesos judiciales registrados"
                      : vistaActual === "administrativos"
                      ? "No hay procesos administrativos registrados"
                      : "Comienza creando tu primer proceso"
                  }
                  color="blue"
                />
              </motion.div>
            ) : (
              <motion.div
                key={vistaActual}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ProcesosTable
                  procesos={procesosFiltrados}
                  onUpdate={cargarProcesos}
                  onProcesoClick={handleProcesoClick}
                  onProcesosChange={setProcesos}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Panel de Información del Proceso */}
      <ProcesoPanel
        proceso={procesoSeleccionado}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setProcesoSeleccionado(null);
        }}
        onUpdate={cargarProcesos}
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
