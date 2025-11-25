"use client";

import { useState, useEffect, useRef } from "react";
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
import ColumnHeader from "./ColumnHeader";

export default function ProcesosTable({
  procesos: initialProcesos,
  onUpdate,
  onProcesoClick,
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
  const [elementosPorPagina, setElementosPorPagina] = useState(20);

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
        (payload) => {
       

          if (payload.eventType === "INSERT") {
            // Recargar todo cuando se inserta un nuevo proceso
            onUpdate?.();
          } else if (payload.eventType === "UPDATE") {
            // Actualizar el proceso específico
            setProcesos((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? { ...p, ...payload.new } : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            // Eliminar el proceso de la lista
            setProcesos((prev) => prev.filter((p) => p.id !== payload.old.id));
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
            .select("id, nombre, color")
            .order("nombre"),
          supabase.from("roles_cliente").select("id, nombre").order("nombre"),
          supabase.from("materias").select("id, nombre").order("nombre"),
          supabase.from("tipos_proceso").select("id, nombre").order("nombre"),
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
      onUpdate?.();
    } catch (error) {
      console.error("Error eliminando procesos:", error);
      alert("Error al eliminar: " + error.message);
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
    <div className="w-full">
      {seleccionados.size > 0 && (
        <div className="mb-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
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
      <div className="w-full overflow-auto bg-white rounded-lg shadow-sm border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 border-b w-10">
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
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 border-b w-10">
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
                <tr className="border-t-2 border-gray-200">
                  <td colSpan="11" className="p-0">
                    <button
                      onClick={crearNuevoProceso}
                      className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span className="text-lg">+</span>
                      <span>Nueva fila</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      {/* Controles de paginación */}
      {procesos.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border">
          {/* Información de elementos */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Mostrando {indexPrimero + 1} a {Math.min(indexUltimo, procesos.length)} de {procesos.length} procesos
            </span>
            
            {/* Selector de elementos por página */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <select
                value={elementosPorPagina}
                onChange={(e) => cambiarElementosPorPagina(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => cambiarPagina(1)}
              disabled={paginaActual === 1}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                paginaActual === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Primera
            </button>
            
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                paginaActual === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let numeroPagina;
                if (totalPaginas <= 5) {
                  numeroPagina = i + 1;
                } else if (paginaActual <= 3) {
                  numeroPagina = i + 1;
                } else if (paginaActual >= totalPaginas - 2) {
                  numeroPagina = totalPaginas - 4 + i;
                } else {
                  numeroPagina = paginaActual - 2 + i;
                }

                return (
                  <button
                    key={numeroPagina}
                    onClick={() => cambiarPagina(numeroPagina)}
                    className={clsx(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      paginaActual === numeroPagina
                        ? "bg-primary-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {numeroPagina}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                paginaActual === totalPaginas
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Siguiente
            </button>

            <button
              onClick={() => cambiarPagina(totalPaginas)}
              disabled={paginaActual === totalPaginas}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                paginaActual === totalPaginas
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Última
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
        "border-b hover:bg-gray-50 transition-colors group",
        isDragging && "bg-primary-50"
      )}
    >
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => onToggleSeleccion(proceso.id)}
          className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </td>
      <td className="px-2 py-1.5 border-r text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <TextCell
        value={proceso.nombre}
        onUpdate={(valor) => actualizarCelda(proceso.id, "nombre", valor)}
        iconButton={
          <button
            onClick={() => onProcesoClick?.(proceso)}
            className="text-gray-300 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Abrir panel"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
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
        placeholder="Tipo"
      />
      <SelectCell
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
      <td className="px-3 py-1.5 border-r text-xs text-gray-600">
        <div className="flex flex-wrap gap-1">
          {proceso.empleados_asignados
            ?.filter((pe) => pe.rol === "responsable")
            .slice(0, 1)
            .map((emp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800"
                title={`${emp.nombre} ${emp.apellido}`}
              >
                {emp.nombre?.charAt(0)}
                {emp.apellido?.charAt(0)}
              </span>
            ))}
          {!proceso.empleados_asignados?.some(
            (pe) => pe.rol === "responsable"
          ) && <span className="text-gray-400">-</span>}
        </div>
      </td>
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
        "px-3 py-1.5 border-r text-xs transition-all",
        editing
          ? "bg-primary-50 shadow-inner ring-2 ring-primary-400 ring-inset"
          : "hover:bg-gray-50 cursor-text"
      )}
    >
      <div className="flex items-center gap-2 min-w-[180px]">
        {iconButton}
        <div className="flex-1" onClick={() => !editing && setEditing(true)}>
          {editing ? (
            <ContentEditable
              innerRef={contentRef}
              html={currentValue || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="outline-none w-full min-h-5"
              style={{ caretColor: "#2563eb" }}
            />
          ) : (
            <div className="min-h-5">{currentValue || ""}</div>
          )}
        </div>
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
          "px-3 py-1.5 border-r cursor-pointer transition-all",
          isOpen
            ? "bg-primary-50 shadow-inner ring-2 ring-primary-400 ring-inset"
            : "hover:bg-gray-50",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium transition-all truncate"
            style={{
              backgroundColor: `${clienteColor}20`,
              color: clienteColor,
            }}
          >
            {value}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Seleccionar...</span>
        )}
      </td>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-50 bg-white border-2 border-primary-400 shadow-xl rounded-lg py-1 min-w-[250px] max-w-[350px] max-h-[300px] overflow-hidden animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Buscador */}
            <div className="px-2 py-2 border-b sticky top-0 bg-white">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-2 py-1 text-sm border rounded outline-none focus:ring-2 focus:ring-primary-400"
                autoFocus
              />
            </div>

            {/* Lista de opciones */}
            <div className="overflow-y-auto max-h-[240px]">
              {filteredOptions.map((option) => {
                const color = getColor ? getColor(option.nombre) : "#6B7280";
                return (
                  <div
                    key={option.id}
                    className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
                    onClick={() => handleSelect(option)}
                  >
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
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
                <div className="px-3 py-2 text-sm text-gray-400">
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

// Componente de celda select con dropdown tipo Notion
function SelectCell({
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

  const handleCreateNew = async () => {
    if (!searchTerm.trim() || !allowCreate || !onCreateNew) return;

    const nuevoEstado = await onCreateNew(searchTerm.trim());
    if (nuevoEstado) {
      onUpdate(nuevoEstado.nombre);
      setIsOpen(false);
      setSearchTerm("");
    }
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
          "px-3 py-1.5 border-r cursor-pointer transition-all",
          isOpen
            ? "bg-primary-50 shadow-inner ring-2 ring-primary-400 ring-inset"
            : "hover:bg-gray-50",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium transition-all truncate"
            style={{
              backgroundColor: color || "#f3f4f6",
              color: textColor || "#374151",
            }}
          >
            {value}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </td>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-50 bg-white border-2 border-primary-400 shadow-xl rounded-lg py-1 min-w-[200px] max-w-[300px] max-h-[300px] overflow-hidden animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Buscador */}
            {allowCreate && (
              <div className="px-2 py-2 border-b sticky top-0 bg-white">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchTerm.trim()) {
                      handleCreateNew();
                    }
                  }}
                  placeholder="Buscar o crear..."
                  className="w-full px-2 py-1 text-sm border rounded outline-none focus:ring-2 focus:ring-primary-400"
                  autoFocus
                />
              </div>
            )}

            {/* Lista de opciones */}
            <div className="overflow-y-auto max-h-[240px]">
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  {option.color ? (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${option.color}20`,
                        color: option.color,
                      }}
                    >
                      {option.nombre}
                    </span>
                  ) : (
                    option.nombre
                  )}
                </div>
              ))}

              {/* Opción de crear nuevo (estilo Notion) */}
              {allowCreate &&
                searchTerm.trim() &&
                filteredOptions.length === 0 && (
                  <div
                    className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors flex items-center gap-2 text-primary-600 font-medium border-t"
                    onClick={handleCreateNew}
                  >
                    <span className="text-lg">+</span>
                    Crear "{searchTerm}"
                  </div>
                )}

              {!allowCreate && filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No hay opciones
                </div>
              )}
            </div>
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
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <td
      className={clsx(
        "px-3 py-1.5 border-r text-xs transition-all",
        editing
          ? "bg-primary-50 shadow-inner ring-2 ring-primary-400 ring-inset"
          : "hover:bg-gray-50 cursor-pointer"
      )}
      onClick={() => !editing && setEditing(true)}
    >
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
        <div className="min-h-5">{formatDate(currentValue)}</div>
      )}
    </td>
  );
}
