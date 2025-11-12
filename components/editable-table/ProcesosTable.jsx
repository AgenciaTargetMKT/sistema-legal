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
import { GripVertical } from "lucide-react";
import ColumnHeader from "./ColumnHeader";

export default function ProcesosTable({
  procesos: initialProcesos,
  onUpdate,
  onProcesoClick,
}) {
  const [procesos, setProcesos] = useState(initialProcesos || []);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);

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
          console.log("Cambio en procesos:", payload);

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
          console.log("Cambio en comentarios:", payload);

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
      const [clientesRes, estadosRes] = await Promise.all([
        supabase.from("clientes").select("id, nombre").order("nombre"),
        supabase
          .from("estados_proceso")
          .select("id, nombre, color")
          .order("nombre"),
      ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
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
      monto_demanda: null,
      observaciones: "",
    });
  };

  return (
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
                label="Estado"
                columnId="estado"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <ColumnHeader
                label="Última Actualización"
                columnId="ultima_actualizacion"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <ColumnHeader
                label="Fecha Act."
                columnId="fecha_actualizacion"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b w-[60px]">
                ⚡
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b w-[60px]">
                📋
              </th>
            </tr>
          </thead>
          <SortableContext
            items={procesos.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {procesos.map((proceso) => (
                <SortableRow
                  key={proceso.id}
                  proceso={proceso}
                  clientes={clientes}
                  estados={estados}
                  actualizarCelda={actualizarCelda}
                  onProcesoClick={onProcesoClick}
                />
              ))}
              <tr className="border-t-2 border-gray-200">
                <td colSpan="8" className="p-0">
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
  );
}

// Componente de fila sorteable
function SortableRow({
  proceso,
  clientes,
  estados,
  actualizarCelda,
  onProcesoClick,
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
        "border-b hover:bg-gray-50 transition-colors",
        isDragging && "bg-blue-50"
      )}
    >
      <td className="px-2 py-2 border-r text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <TextCell
        value={proceso.nombre}
        onUpdate={(valor) => actualizarCelda(proceso.id, "nombre", valor)}
      />
      <SelectCell
        value={proceso.cliente?.nombre || ""}
        options={clientes}
        onUpdate={(clienteNombre) => {
          const cliente = clientes.find((c) => c.nombre === clienteNombre);
          if (cliente) {
            actualizarCelda(proceso.id, "cliente_id", cliente.id);
          }
        }}
        color="#EEF2FF"
        textColor="#4F46E5"
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
      />
      <td
        className="px-4 py-2 border-r text-sm text-gray-600 cursor-pointer hover:bg-gray-100"
        onClick={() => onProcesoClick?.(proceso)}
      >
        {proceso.ultima_actualizacion?.descripcion || (
          <span className="text-gray-400">Agregar comentario...</span>
        )}
      </td>
      <td className="px-4 py-2 border-r text-sm text-gray-600">
        {proceso.ultima_actualizacion?.fecha_actualizacion
          ? new Date(
              proceso.ultima_actualizacion.fecha_actualizacion
            ).toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </td>
      <td className="px-4 py-2 border-r text-center">
        <input
          type="checkbox"
          checked={proceso.impulso || false}
          onChange={(e) =>
            actualizarCelda(proceso.id, "impulso", e.target.checked)
          }
          className="w-4 h-4 cursor-pointer accent-blue-600"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <button
          onClick={() => onProcesoClick?.(proceso)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Ver
        </button>
      </td>
    </tr>
  );
}

// Componente de celda de texto editable
function TextCell({ value, onUpdate }) {
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
        "px-4 py-2 border-r text-sm transition-all",
        editing
          ? "bg-blue-50 shadow-inner ring-2 ring-blue-400 ring-inset"
          : "hover:bg-gray-50 cursor-text"
      )}
      onClick={() => !editing && setEditing(true)}
    >
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
    </td>
  );
}

// Componente de celda select con dropdown tipo Notion
function SelectCell({ value, options, onUpdate, color, textColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

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
          "px-4 py-2 border-r cursor-pointer transition-all",
          isOpen
            ? "bg-blue-50 shadow-inner ring-2 ring-blue-400 ring-inset"
            : "hover:bg-gray-50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span
            className="inline-block px-2 py-1 rounded text-sm font-medium transition-all"
            style={{
              backgroundColor: color || "#f3f4f6",
              color: textColor || "#374151",
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
            className="z-50 bg-white border-2 border-blue-400 shadow-xl rounded-lg py-1 min-w-[200px] max-h-[300px] overflow-auto animate-in fade-in duration-150"
          >
            {options.map((option) => (
              <div
                key={option.id}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors"
                onClick={() => handleSelect(option)}
              >
                {option.nombre}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">
                No hay opciones
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
