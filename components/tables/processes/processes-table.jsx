"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ContentEditable from "react-contenteditable";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelRightOpen, Trash2 } from "lucide-react";
import { ColumnHeader } from "../shared";

// Función para generar color basado en string (para catálogos sin color)
const getColorFromString = (str) => {
  const colores = [
    { bg: "#DBEAFE", text: "#2563EB" }, // Azul
    { bg: "#D1FAE5", text: "#059669" }, // Verde
    { bg: "#FEF3C7", text: "#D97706" }, // Amarillo
    { bg: "#EDE9FE", text: "#7C3AED" }, // Púrpura
    { bg: "#FCE7F3", text: "#DB2777" }, // Rosa
    { bg: "#BAE6FD", text: "#0284C7" }, // Azul claro
    { bg: "#FED7AA", text: "#EA580C" }, // Naranja
    { bg: "#A7F3D0", text: "#047857" }, // Verde claro
    { bg: "#FEE2E2", text: "#DC2626" }, // Rojo
    { bg: "#C7D2FE", text: "#4338CA" }, // Índigo
    { bg: "#FECACA", text: "#B91C1C" }, // Rojo suave
    { bg: "#DDD6FE", text: "#6D28D9" }, // Violeta
  ];

  let hash = 0;
  const idStr = String(str || "default");

  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  hash = Math.abs(hash);
  const index = hash % colores.length;

  return colores[index];
};

export default function ProcesosTable({
  procesos: initialProcesos,
  onUpdate,
  onProcesoClick,
  onProcesosChange, // Callback para notificar cambios en procesos
}) {
  const [procesos, setProcesos] = useState(initialProcesos || []);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [rolesCliente, setRolesCliente] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [seleccionados, setSeleccionados] = useState(new Set());

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(50);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setProcesos(initialProcesos || []);
  }, [initialProcesos]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Realtime subscription para procesos
  useEffect(() => {
    const channel = supabase
      .channel("procesos-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "procesos",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Recargar todo cuando se inserta un nuevo proceso
            onUpdate?.();
          } else if (payload.eventType === "UPDATE") {
            // Cargar el proceso actualizado con todas sus relaciones
            const { data: procesoActualizado } = await supabase
              .from("procesos")
              .select(
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
              )
              .eq("id", payload.new.id)
              .single();

            if (procesoActualizado) {
              // Transformar empleados
              procesoActualizado.empleados_asignados =
                procesoActualizado.empleados_asignados?.map(
                  (pe) => pe.empleado
                ) || [];

              setProcesos((prev) => {
                const newProcesos = prev.map((p) =>
                  p.id === payload.new.id ? { ...p, ...procesoActualizado } : p
                );
                // Notificar al padre sobre el cambio
                setTimeout(() => {
                  onProcesosChange?.(newProcesos);
                }, 0);
                return newProcesos;
              });
            }
          } else if (payload.eventType === "DELETE") {
            // Eliminar el proceso de la lista
            setProcesos((prev) => {
              const newProcesos = prev.filter((p) => p.id !== payload.old.id);
              onProcesosChange?.(newProcesos);
              return newProcesos;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);

  // Realtime subscription para comentarios (actualizar ultima_actualizacion)
  useEffect(() => {
    const channel = supabase
      .channel("comentarios-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comentarios",
        },
        async (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const procesoId = payload.new.proceso_id;

            // Actualizar la ultima_actualizacion del proceso
            setProcesos((prev) =>
              prev.map((p) =>
                p.id === procesoId
                  ? {
                      ...p,
                      ultima_actualizacion: {
                        descripcion: payload.new.contenido,
                        fecha_actualizacion: payload.new.created_at,
                      },
                    }
                  : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            // Si se eliminó un comentario, buscar el siguiente más reciente
            const procesoId = payload.old.proceso_id;

            const { data: ultimoComentario } = await supabase
              .from("comentarios")
              .select("contenido, created_at")
              .eq("proceso_id", procesoId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            setProcesos((prev) =>
              prev.map((p) =>
                p.id === procesoId
                  ? {
                      ...p,
                      ultima_actualizacion: ultimoComentario
                        ? {
                            descripcion: ultimoComentario.contenido,
                            fecha_actualizacion: ultimoComentario.created_at,
                          }
                        : null,
                    }
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime subscription para proceso_empleados (responsables)
  useEffect(() => {
    const channel = supabase
      .channel("proceso-empleados-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proceso_empleados",
        },
        async (payload) => {
          const procesoId = payload.new?.proceso_id || payload.old?.proceso_id;
          if (!procesoId) return;

          // Recargar empleados asignados para este proceso
          const { data: empleadosData } = await supabase
            .from("proceso_empleados")
            .select(
              `
              rol,
              empleado:empleados(id, nombre, apellido)
            `
            )
            .eq("proceso_id", procesoId)
            .eq("activo", true);

          const empleadosTransformados =
            empleadosData?.map((pe) => pe.empleado) || [];

          setProcesos((prev) =>
            prev.map((p) =>
              p.id === procesoId
                ? { ...p, empleados_asignados: empleadosTransformados }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Función para ordenar procesos
  const handleSort = (columnId, direction) => {
    if (!direction) {
      setSortConfig(null);
      setProcesos([...initialProcesos]);
      return;
    }

    setSortConfig({ column: columnId, direction });

    const sorted = [...procesos].sort((a, b) => {
      let aVal, bVal;

      switch (columnId) {
        case "nombre":
          aVal = a.nombre?.toLowerCase() || "";
          bVal = b.nombre?.toLowerCase() || "";
          break;
        case "cliente":
          aVal = a.cliente?.nombre?.toLowerCase() || "";
          bVal = b.cliente?.nombre?.toLowerCase() || "";
          break;
        case "estado":
          aVal = a.estado?.nombre?.toLowerCase() || "";
          bVal = b.estado?.nombre?.toLowerCase() || "";
          break;
        case "ultima_actualizacion":
          aVal = a.ultima_actualizacion || "";
          bVal = b.ultima_actualizacion || "";
          break;
        case "fecha_actualizacion":
          aVal = a.fecha_actualizacion || "";
          bVal = b.fecha_actualizacion || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setProcesos(sorted);
  };

  const cargarCatalogos = async () => {
    try {
      const [clientesRes, estadosRes, rolesRes, materiasRes, tiposRes] =
        await Promise.all([
          supabase.from("clientes").select("id, nombre").order("nombre"),
          supabase
            .from("estados_proceso")
            .select("id, nombre, color, categoria, orden")
            .order("orden"),
          supabase
            .from("roles_cliente")
            .select("id, nombre, color")
            .order("nombre"),
          supabase.from("materias").select("id, nombre, color").order("nombre"),
          supabase
            .from("tipos_proceso")
            .select("id, nombre, color")
            .order("nombre"),
        ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (rolesRes.data) setRolesCliente(rolesRes.data);
      if (materiasRes.data) setMaterias(materiasRes.data);
      if (tiposRes.data) setTiposProceso(tiposRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  // Generar color aleatorio para clientes
  const generarColorAleatorio = () => {
    const colores = [
      "#EF4444", // Rojo
      "#F59E0B", // Ámbar
      "#10B981", // Verde
      "#3B82F6", // Azul
      "#8B5CF6", // Violeta
      "#EC4899", // Rosa
      "#06B6D4", // Cyan
      "#F97316", // Naranja
      "#84CC16", // Lima
      "#6366F1", // Indigo
    ];
    return colores[Math.floor(Math.random() * colores.length)];
  };

  // Obtener color consistente para un cliente (basado en su nombre)
  const getClienteColor = (clienteNombre) => {
    if (!clienteNombre) return "#6B7280";

    // Generar hash simple del nombre
    let hash = 0;
    for (let i = 0; i < clienteNombre.length; i++) {
      hash = clienteNombre.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colores = [
      "#EF4444",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#F97316",
      "#84CC16",
      "#6366F1",
    ];

    return colores[Math.abs(hash) % colores.length];
  };

  // Crear nuevo estado
  const crearNuevoEstado = async (nombreEstado) => {
    try {
      const colorAleatorio = generarColorAleatorio();

      const { data, error } = await supabase
        .from("estados_proceso")
        .insert({
          nombre: nombreEstado,
          color: colorAleatorio,
          orden: estados.length + 1,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar a la lista local
      setEstados((prev) => [...prev, data]);

      return data;
    } catch (error) {
      console.error("Error creando estado:", error);
      return null;
    }
  };

  const actualizarCelda = async (procesoId, campo, valor) => {
    try {
      const { error } = await supabase
        .from("procesos")
        .update({ [campo]: valor })
        .eq("id", procesoId);

      if (error) throw error;

      // Si es una relación, obtener el objeto completo
      if (campo === "cliente_id" && valor) {
        const cliente = clientes.find((c) => c.id === valor);
        setProcesos((prev) =>
          prev.map((p) => (p.id === procesoId ? { ...p, cliente } : p))
        );
      } else if (campo === "estado_id" && valor) {
        const estado = estados.find((e) => e.id === valor);
        setProcesos((prev) =>
          prev.map((p) => (p.id === procesoId ? { ...p, estado } : p))
        );
      } else {
        // Actualizar localmente para campos simples
        setProcesos((prev) =>
          prev.map((p) => (p.id === procesoId ? { ...p, [campo]: valor } : p))
        );
      }
    } catch (error) {
      console.error("Error actualizando:", error);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = procesos.findIndex((p) => p.id === active.id);
      const newIndex = procesos.findIndex((p) => p.id === over.id);

      const newProcesos = arrayMove(procesos, oldIndex, newIndex);
      setProcesos(newProcesos);

      // Actualizar orden en la base de datos
      try {
        const updates = newProcesos.map((proceso, index) => ({
          id: proceso.id,
          orden: index,
        }));

        for (const update of updates) {
          await supabase
            .from("procesos")
            .update({ orden: update.orden })
            .eq("id", update.id);
        }
      } catch (error) {
        console.error("Error actualizando orden:", error);
      }
    }
  };

  const crearNuevoProceso = async () => {
    // En lugar de crear directamente, abrir el panel vacío
    onProcesoClick?.({
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
  };

  const toggleSeleccion = (procesoId) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(procesoId)) {
        nuevo.delete(procesoId);
      } else {
        nuevo.add(procesoId);
      }
      return nuevo;
    });
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.size === procesos.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(procesos.map((p) => p.id)));
    }
  };

  const eliminarSeleccionados = async () => {
    if (seleccionados.size === 0) return;

    const mensaje =
      seleccionados.size === 1
        ? "¿Eliminar 1 proceso seleccionado?"
        : `¿Eliminar ${seleccionados.size} procesos seleccionados?`;

    if (!confirm(mensaje)) return;

    try {
      const { error } = await supabase
        .from("procesos")
        .delete()
        .in("id", Array.from(seleccionados));

      if (error) throw error;

      setSeleccionados(new Set());
      toast.success("Proceso(s) eliminado(s) exitosamente");
      onUpdate?.();
    } catch (error) {
      console.error("Error eliminando procesos:", error);
      toast.error("Error al eliminar: " + error.message);
    }
  };

  // Calcular paginación
  const indexUltimo = paginaActual * elementosPorPagina;
  const indexPrimero = indexUltimo - elementosPorPagina;
  const procesosPaginados = procesos.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(procesos.length / elementosPorPagina);

  // Resetear a página 1 cuando cambian los procesos o elementos por página
  useEffect(() => {
    setPaginaActual(1);
  }, [elementosPorPagina, procesos.length]);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const cambiarElementosPorPagina = (cantidad) => {
    setElementosPorPagina(cantidad);
    setPaginaActual(1);
  };

  return (
    <div className="w-full space-y-3">
      {/* Barra de selección múltiple */}
      {seleccionados.size > 0 && (
        <div className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary-900 font-medium">
            {seleccionados.size} proceso{seleccionados.size !== 1 ? "s" : ""}{" "}
            seleccionado{seleccionados.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={eliminarSeleccionados}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="w-full overflow-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-100 border-b w-10">
                  <input
                    type="checkbox"
                    checked={
                      procesos.length > 0 &&
                      seleccionados.size === procesos.length
                    }
                    onChange={toggleSeleccionarTodos}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-100 border-b w-10">
                  ⋮⋮
                </th>
                <ColumnHeader
                  label="Nombre"
                  columnId="nombre"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Cliente"
                  columnId="cliente"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Rol Cliente"
                  columnId="rol_cliente"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Materia"
                  columnId="materia"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Tipo Proceso"
                  columnId="tipo_proceso"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Estado"
                  columnId="estado"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Fecha Vencimiento"
                  columnId="fecha_vencimiento"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Responsable"
                  columnId="responsable"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Impulso"
                  columnId="impulso"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
              </tr>
            </thead>
            <SortableContext
              items={procesosPaginados.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {procesosPaginados.map((proceso) => (
                  <SortableRow
                    key={proceso.id}
                    proceso={proceso}
                    clientes={clientes}
                    estados={estados}
                    rolesCliente={rolesCliente}
                    materias={materias}
                    tiposProceso={tiposProceso}
                    actualizarCelda={actualizarCelda}
                    onProcesoClick={onProcesoClick}
                    seleccionado={seleccionados.has(proceso.id)}
                    onToggleSeleccion={toggleSeleccion}
                    getClienteColor={getClienteColor}
                    crearNuevoEstado={crearNuevoEstado}
                  />
                ))}
              </tbody>
            </SortableContext>
            <tbody>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                <td colSpan="10" className="px-3 py-2.5">
                  <button
                    onClick={crearNuevoProceso}
                    className="w-full text-left text-sm text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2 py-1"
                  >
                    <span className="text-base">+</span>
                    <span>Agregar proceso</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Paginación inferior - Compacta */}
      {procesos.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          {/* Selector e info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Mostrar
            </span>
            <select
              value={elementosPorPagina}
              onChange={(e) =>
                cambiarElementosPorPagina(Number(e.target.value))
              }
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-primary-400 focus:border-primary-400 outline-none bg-white dark:bg-gray-800 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {indexPrimero + 1}-{Math.min(indexUltimo, procesos.length)} de{" "}
              {procesos.length}
            </span>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={clsx(
                "p-1.5 text-xs rounded-md transition-colors",
                paginaActual === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-primary-600"
              )}
              title="Anterior"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              {paginaActual} / {totalPaginas}
            </span>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={clsx(
                "p-1.5 text-xs rounded-md transition-colors",
                paginaActual === totalPaginas
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 hover:text-primary-600"
              )}
              title="Siguiente"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de fila sorteable
function SortableRow({
  proceso,
  clientes,
  estados,
  rolesCliente,
  materias,
  tiposProceso,
  actualizarCelda,
  onProcesoClick,
  seleccionado,
  onToggleSeleccion,
  getClienteColor,
  crearNuevoEstado,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proceso.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={clsx(
        "border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
      )}
    >
      <td className="px-2 py-2 text-center border-r">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => onToggleSeleccion(proceso.id)}
          className="cursor-pointer"
        />
      </td>
      <td className="px-2 py-2 text-center border-r">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </td>
      <TextCell
        value={proceso.nombre}
        onUpdate={(valor) => actualizarCelda(proceso.id, "nombre", valor)}
        iconButton={
          <button
            onClick={() => onProcesoClick?.(proceso)}
            className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
            title="Abrir panel"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
            <span>Abrir</span>
          </button>
        }
      />
      <SearchableSelectCell
        value={proceso.cliente?.nombre || ""}
        options={clientes}
        onUpdate={(clienteNombre) => {
          const cliente = clientes.find((c) => c.nombre === clienteNombre);
          if (cliente) {
            actualizarCelda(proceso.id, "cliente_id", cliente.id);
          }
        }}
        getColor={getClienteColor}
        className="max-w-[150px]"
      />
      <SelectCell
        value={proceso.rol_cliente?.nombre || ""}
        options={rolesCliente}
        onUpdate={(rolNombre) => {
          const rol = rolesCliente.find((r) => r.nombre === rolNombre);
          if (rol) {
            actualizarCelda(proceso.id, "rol_cliente_id", rol.id);
          }
        }}
        color={
          proceso.rol_cliente?.color
            ? `${proceso.rol_cliente.color}20`
            : undefined
        }
        textColor={proceso.rol_cliente?.color}
        placeholder="Rol"
      />
      <SelectCell
        value={proceso.materia?.nombre || ""}
        options={materias}
        onUpdate={(materiaNombre) => {
          const materia = materias.find((m) => m.nombre === materiaNombre);
          if (materia) {
            actualizarCelda(proceso.id, "materia_id", materia.id);
          }
        }}
        color={
          proceso.materia?.color ? `${proceso.materia.color}20` : undefined
        }
        textColor={proceso.materia?.color}
        placeholder="Materia"
      />
      <SelectCell
        value={proceso.tipo_proceso?.nombre || ""}
        options={tiposProceso}
        onUpdate={(tipoNombre) => {
          const tipo = tiposProceso.find((t) => t.nombre === tipoNombre);
          if (tipo) {
            actualizarCelda(proceso.id, "tipo_proceso_id", tipo.id);
          }
        }}
        color={
          proceso.tipo_proceso?.color
            ? `${proceso.tipo_proceso.color}20`
            : undefined
        }
        textColor={proceso.tipo_proceso?.color}
        placeholder="Tipo"
      />
      <EstadoSelectCell
        value={proceso.estado?.nombre || ""}
        options={estados}
        onUpdate={(estadoNombre) => {
          const estado = estados.find((e) => e.nombre === estadoNombre);
          if (estado) {
            actualizarCelda(proceso.id, "estado_id", estado.id);
          }
        }}
        color={proceso.estado?.color ? `${proceso.estado.color}20` : "#f3f4f6"}
        textColor={proceso.estado?.color || "#374151"}
        allowCreate={true}
        onCreateNew={crearNuevoEstado}
        placeholder="Estado"
      />
      <DateCell
        value={proceso.fecha_proximo_contacto || ""}
        onUpdate={(valor) =>
          actualizarCelda(proceso.id, "fecha_proximo_contacto", valor)
        }
      />
      <EmpleadosProcesoDisplay
        empleados={proceso.empleados_asignados || []}
        onProcesoClick={() => onProcesoClick?.(proceso)}
      />
      <td className="px-3 py-1.5 border-r text-center">
        <input
          type="checkbox"
          checked={proceso.impulso || false}
          onChange={(e) =>
            actualizarCelda(proceso.id, "impulso", e.target.checked)
          }
          className="cursor-pointer w-4 h-4"
        />
      </td>
    </tr>
  );
}

// Componente de celda de texto editable
function TextCell({ value, onUpdate, iconButton }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const contentRef = useRef();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && contentRef.current) {
      contentRef.current.focus();

      // Agregar listener para el teclado
      const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setCurrentValue(value);
          setEditing(false);
        }
      };

      contentRef.current.addEventListener("keydown", handleKeyDown);
      return () => {
        contentRef.current?.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [editing, currentValue, value]);

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value && currentValue.trim() !== "") {
      onUpdate(currentValue.trim());
    } else if (currentValue.trim() === "") {
      setCurrentValue(value); // Restaurar valor anterior si está vacío
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <td
      className={clsx(
        "px-3 py-1.5 border-r text-sm transition-all",
        editing
          ? "bg-primary-50/50 dark:bg-primary-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-text"
      )}
    >
      <div className="flex items-center gap-2 min-w-[180px]">
        <div className="flex-1" onClick={() => !editing && setEditing(true)}>
          {editing ? (
            <ContentEditable
              innerRef={contentRef}
              html={currentValue || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="outline-none w-full min-h-5 font-medium"
              style={{ caretColor: "#2563eb" }}
            />
          ) : (
            <div className="min-h-5 font-medium text-gray-900 dark:text-gray-100">
              {currentValue || ""}
            </div>
          )}
        </div>
        {iconButton}
      </div>
    </td>
  );
}

// Componente de celda select con búsqueda (para clientes)
function SearchableSelectCell({
  value,
  options,
  onUpdate,
  getColor,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  const filteredOptions = options.filter((opt) =>
    opt.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onUpdate(option.nombre);
    setIsOpen(false);
    setSearchTerm("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popperElement &&
        !popperElement.contains(e.target) &&
        referenceElement &&
        !referenceElement.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, popperElement, referenceElement]);

  const clienteColor = getColor ? getColor(value) : "#6B7280";

  return (
    <>
      <td
        ref={setReferenceElement}
        className={clsx(
          "px-3 py-1.5 border-r cursor-pointer transition-all align-middle",
          isOpen ? "bg-primary-50/50" : "hover:bg-gray-50",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center min-h-6">
          {value ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 truncate max-w-full"
              style={{
                backgroundColor: `${clienteColor}20`,
                color: clienteColor,
              }}
            >
              {value}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-xs">
              Seleccionar...
            </span>
          )}
        </div>
      </td>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 min-w-[250px] max-w-[350px] max-h-[300px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Buscador */}
            <div className="px-2 py-2 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-2 py-1 text-sm border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
                autoFocus
              />
            </div>

            {/* Lista de opciones */}
            <div className="overflow-y-auto max-h-60">
              {filteredOptions.map((option) => {
                const color = getColor ? getColor(option.nombre) : "#6B7280";
                return (
                  <div
                    key={option.id}
                    className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors"
                    onClick={() => handleSelect(option)}
                  >
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      {option.nombre}
                    </span>
                  </div>
                );
              })}

              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                  No se encontraron clientes
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// Componente de celda select con dropdown compacto - Estilo Badge (para Materia, Rol Cliente, etc.)
function SelectCell({
  value,
  options,
  onUpdate,
  color,
  textColor,
  className,
  placeholder = "Seleccionar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  const opcionActual = options.find((opt) => opt.nombre === value);

  const handleSelect = (option) => {
    onUpdate(option.nombre);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popperElement &&
        !popperElement.contains(e.target) &&
        referenceElement &&
        !referenceElement.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, popperElement, referenceElement]);

  return (
    <>
      <td
        ref={setReferenceElement}
        className={clsx(
          "px-3 py-1.5 border-r cursor-pointer transition-all align-middle relative",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="inline-flex items-center">
          {opcionActual ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: `${opcionActual.color}20`,
                color: opcionActual.color,
              }}
            >
              {opcionActual.nombre}
            </span>
          ) : (
            <span className="text-xs text-gray-400 px-2 py-1">
              {placeholder}
            </span>
          )}
        </div>
      </td>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 min-w-36 max-w-48 max-h-64 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className="w-full px-2 py-0.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${option.color}20`,
                    color: option.color,
                  }}
                >
                  {option.nombre}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

// Componente de celda select para Estados con secciones (Pendiente, En curso, Completado)
function EstadoSelectCell({
  value,
  options,
  onUpdate,
  color,
  textColor,
  className,
  allowCreate = false,
  onCreateNew,
  placeholder = "Seleccionar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  // Buscar el estado actual en las opciones
  const estadoActual = options.find((e) => e.nombre === value);

  // Agrupar estados por categoría
  const estadosAgrupados = {
    Pendiente: options.filter((e) => e.categoria === "Pendiente"),
    En_curso: options.filter((e) => e.categoria === "En_curso"),
    Completado: options.filter((e) => e.categoria === "Completado"),
  };

  const categorias = [
    { key: "Pendiente", label: "Pendiente" },
    { key: "En_curso", label: "En curso" },
    { key: "Completado", label: "Completado" },
  ];

  const handleSelect = (option) => {
    onUpdate(option.nombre);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popperElement &&
        !popperElement.contains(e.target) &&
        referenceElement &&
        !referenceElement.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, popperElement, referenceElement]);

  return (
    <>
      <td
        ref={setReferenceElement}
        className={clsx(
          "px-3 py-1.5 border-r cursor-pointer transition-all align-middle relative",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="inline-flex items-center">
          {estadoActual ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: `${estadoActual.color}20`,
                color: estadoActual.color,
              }}
            >
              {estadoActual.nombre}
            </span>
          ) : (
            <span className="text-xs text-gray-400 px-2 py-1">
              {placeholder}
            </span>
          )}
        </div>
      </td>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 min-w-56 max-w-72 max-h-96 overflow-y-auto"
          >
            {categorias.map((categoria) => {
              const estadosCategoria = estadosAgrupados[categoria.key];
              if (!estadosCategoria || estadosCategoria.length === 0)
                return null;

              return (
                <div key={categoria.key} className="mb-0.5 last:mb-0">
                  <div className="px-2 py-0.5 text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {categoria.label}
                  </div>
                  {estadosCategoria.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => handleSelect(estado)}
                      className="w-full px-2 py-0.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${estado.color}20`,
                          color: estado.color,
                        }}
                      >
                        {estado.nombre}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

// Componente de celda de fecha
function DateCell({ value, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
      onUpdate(currentValue);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    // El formato de la BD es YYYY-MM-DD
    const [year, month, day] = dateString.split("-").map(Number);
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  return (
    <td
      className={clsx(
        "px-3 py-2 border-r text-xs transition-all align-middle",
        editing ? "bg-primary-50/50" : "hover:bg-gray-50 cursor-pointer"
      )}
      onClick={() => !editing && setEditing(true)}
    >
      <div className="flex items-center min-h-6">
        {editing ? (
          <input
            type="date"
            value={currentValue || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full outline-none bg-transparent text-xs"
            autoFocus
          />
        ) : (
          <span>{formatDate(currentValue)}</span>
        )}
      </div>
    </td>
  );
}

// Componente para mostrar empleados asignados como badges coloridos
function EmpleadosProcesoDisplay({ empleados, onProcesoClick }) {
  // Función para generar color único basado en ID o nombre del empleado
  const getEmpleadoColor = (empleadoId, nombreEmpleado = "") => {
    const colores = [
      { bg: "#DBEAFE", text: "#2563EB" }, // Azul
      { bg: "#D1FAE5", text: "#059669" }, // Verde
      { bg: "#FEF3C7", text: "#D97706" }, // Amarillo/Naranja
      { bg: "#EDE9FE", text: "#7C3AED" }, // Púrpura
      { bg: "#FCE7F3", text: "#DB2777" }, // Rosa
      { bg: "#BAE6FD", text: "#0284C7" }, // Azul claro
      { bg: "#FED7AA", text: "#EA580C" }, // Naranja claro
      { bg: "#A7F3D0", text: "#047857" }, // Verde claro
      { bg: "#FEE2E2", text: "#DC2626" }, // Rojo
      { bg: "#C7D2FE", text: "#4338CA" }, // Índigo
    ];

    let hash = 0;
    const idStr = String(empleadoId || nombreEmpleado || "default");

    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    hash = Math.abs(hash);
    const index = (hash * 2654435761) % colores.length;

    return colores[index];
  };

  const empleadosArray = Array.isArray(empleados) ? empleados : [];
  const empleadosValidos = empleadosArray.filter(
    (emp) => emp && (emp.nombre || emp.apellido)
  );

  return (
    <td className="px-3 py-1.5 border-r relative group">
      <div className="flex flex-wrap gap-1 min-w-[120px]">
        {empleadosValidos.length > 0 ? (
          empleadosValidos.map((empleado, index) => {
            const nombre = empleado.nombre
              ? empleado.nombre.split(" ")[0]
              : empleado.apellido?.split(" ")[0] || "?";
            const colorObj = getEmpleadoColor(empleado.id, empleado.nombre);

            return (
              <span
                key={empleado.id || index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colorObj.bg,
                  color: colorObj.text,
                }}
                title={`${empleado.nombre || ""} ${empleado.apellido || ""} ${
                  empleado.rol ? `(${empleado.rol})` : ""
                }`}
              >
                {nombre}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Sin asignar
          </span>
        )}

        {/* Botón para abrir panel (visible en hover) */}
        <button
          onClick={() => onProcesoClick?.()}
          className="ml-1 text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Editar asignados"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
      </div>
    </td>
  );
}
