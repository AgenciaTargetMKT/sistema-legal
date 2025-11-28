"use client";

import { useState, useEffect } from "react";
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
import ProcesosTable from "@/components/tables/editable/ProcesosTable";
import ProcesoPanel from "@/components/tables/editable/ProcesoPanel";
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
} from "lucide-react";
import { formatearFecha } from "@/lib/utils";

export default function ProcesosPage() {
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [vistaActual, setVistaActual] = useState("tabla"); // 'tabla' o 'cards'
  const [procesoSeleccionado, setProcesoSeleccionado] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tareaDialogOpen, setTareaDialogOpen] = useState(false);
  const [tareaInicial, setTareaInicial] = useState(null);
  const [procesoDialogOpen, setProcesoDialogOpen] = useState(false);
  const [procesoEditar, setProcesoEditar] = useState(null);

  useEffect(() => {
    cargarProcesos();
  }, []);

  const cargarProcesos = async () => {
    try {
      setLoading(true);

      // Intentar ordenar por 'orden', si falla usar 'created_at'
      let query = supabase.from("procesos").select(
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

  const procesosFiltrados = procesos.filter((proceso) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      proceso.numero_proceso?.toLowerCase().includes(searchLower) ||
      proceso.nombre?.toLowerCase().includes(searchLower) ||
      proceso.cliente?.nombre?.toLowerCase().includes(searchLower)
    );
  });

  // Estadísticas
  const stats = {
    total: procesos.length,
    activos: procesos.filter((p) => p.estado_general === "activo").length,
    concluidos: procesos.filter((p) => p.estado_general === "concluido").length,
    impulsos: procesos.filter((p) => p.impulso === true).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Search and Filters */}
      <div>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Procesos</CardTitle>
            <div className="flex gap-2">
              {/* Toggle Vista */}
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={vistaActual === "tabla" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setVistaActual("tabla")}
                  className="gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  Tabla
                </Button>
                <Button
                  variant={vistaActual === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setVistaActual("cards")}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </Button>
              </div>

              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, nombre o cliente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="mr-2">
                <Filter className="h-4 w-4 " />
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
                  Cargando procesos...
                </p>
              </div>
            </div>
          ) : procesosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay procesos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron procesos con ese criterio"
                  : "Comienza creando tu primer proceso"}
              </p>
              {!searchTerm && (
                <Button onClick={handleNuevoProceso}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proceso
                </Button>
              )}
            </div>
          ) : vistaActual === "tabla" ? (
            <ProcesosTable
              procesos={procesosFiltrados}
              onUpdate={cargarProcesos}
              onProcesoClick={handleProcesoClick}
            />
          ) : (
            <div className="space-y-4">
              {procesosFiltrados.map((proceso) => (
                <Card
                  key={proceso.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProcesoClick(proceso)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {proceso.numero_proceso}
                          </h3>
                          {proceso.impulso && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                              Impulso
                            </span>
                          )}
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: proceso.estado?.color + "20",
                              color: proceso.estado?.color,
                            }}
                          >
                            {proceso.estado?.nombre || "Sin estado"}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{proceso.nombre}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            Cliente: {proceso.cliente?.nombre || "N/A"}
                          </span>
                          <span>•</span>
                          <span>
                            Materia: {proceso.materia?.nombre || "N/A"}
                          </span>
                          <span>•</span>
                          <span>Vs. {proceso.contra_parte || "N/A"}</span>
                        </div>
                        {proceso.fecha_proximo_contacto && (
                          <p className="text-xs text-muted-foreground">
                            Próximo contacto:{" "}
                            {formatearFecha(proceso.fecha_proximo_contacto)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcesoClick(proceso);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditarProceso(proceso);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarProceso(proceso);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
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
