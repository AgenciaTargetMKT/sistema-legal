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

export default function TareasTable({
  tareas: initialTareas,
  onUpdate,
  onTareaClick,
}) {
  const [tareas, setTareas] = useState(initialTareas || []);
  const [procesos, setProcesos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setTareas(initialTareas || []);
  }, [initialTareas]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Realtime subscription para tareas
  useEffect(() => {
    const channel = supabase
      .channel("tareas-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
        },
        (payload) => {
          console.log("Cambio en tareas:", payload);

          if (payload.eventType === "INSERT") {
            onUpdate?.();
          } else if (payload.eventType === "UPDATE") {
            setTareas((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? { ...t, ...payload.new } : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTareas((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);

  const handleSort = (columnId, direction) => {
    if (!direction) {
      setSortConfig(null);
      setTareas([...initialTareas]);
      return;
    }

    setSortConfig({ column: columnId, direction });

    const sorted = [...tareas].sort((a, b) => {
      let aVal, bVal;

      switch (columnId) {
        case "titulo":
          aVal = a.titulo?.toLowerCase() || "";
          bVal = b.titulo?.toLowerCase() || "";
          break;
        case "proceso":
          aVal = a.proceso?.nombre?.toLowerCase() || "";
          bVal = b.proceso?.nombre?.toLowerCase() || "";
          break;
        case "estado":
          aVal = a.estado?.nombre?.toLowerCase() || "";
          bVal = b.estado?.nombre?.toLowerCase() || "";
          break;
        case "prioridad":
          const prioridadOrden = { alta: 3, media: 2, baja: 1 };
          aVal = prioridadOrden[a.prioridad] || 0;
          bVal = prioridadOrden[b.prioridad] || 0;
          break;
        case "empleado":
          aVal = a.empleado_asignado?.nombre?.toLowerCase() || "";
          bVal = b.empleado_asignado?.nombre?.toLowerCase() || "";
          break;
        case "fecha_vencimiento":
          aVal = a.fecha_vencimiento || "";
          bVal = b.fecha_vencimiento || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setTareas(sorted);
  };

  const cargarCatalogos = async () => {
    try {
      const [procesosRes, estadosRes, empleadosRes] = await Promise.all([
        supabase
          .from("procesos")
          .select("id, nombre, numero_proceso")
          .order("nombre"),
        supabase
          .from("estados_tarea")
          .select("id, nombre, color")
          .order("nombre"),
        supabase
          .from("empleados")
          .select("id, nombre, apellido")
          .eq("activo", true)
          .order("nombre"),
      ]);

      if (procesosRes.data) setProcesos(procesosRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (empleadosRes.data) setEmpleados(empleadosRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  const actualizarCelda = async (tareaId, campo, valor) => {
    try {
      const { error } = await supabase
        .from("tareas")
        .update({ [campo]: valor })
        .eq("id", tareaId);

      if (error) throw error;

      if (campo === "proceso_id" && valor) {
        const proceso = procesos.find((p) => p.id === valor);
        setTareas((prev) =>
          prev.map((t) => (t.id === tareaId ? { ...t, proceso } : t))
        );
      } else if (campo === "estado_id" && valor) {
        const estado = estados.find((e) => e.id === valor);
        setTareas((prev) =>
          prev.map((t) => (t.id === tareaId ? { ...t, estado } : t))
        );
      } else if (campo === "empleado_id" && valor) {
        const empleado = empleados.find((e) => e.id === valor);
        setTareas((prev) =>
          prev.map((t) =>
            t.id === tareaId ? { ...t, empleado_asignado: empleado } : t
          )
        );
      } else {
        setTareas((prev) =>
          prev.map((t) => (t.id === tareaId ? { ...t, [campo]: valor } : t))
        );
      }
    } catch (error) {
      console.error("Error actualizando:", error);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tareas.findIndex((t) => t.id === active.id);
      const newIndex = tareas.findIndex((t) => t.id === over.id);

      const newTareas = arrayMove(tareas, oldIndex, newIndex);
      setTareas(newTareas);

      try {
        const updates = newTareas.map((tarea, index) => ({
          id: tarea.id,
          orden: index,
        }));

        for (const update of updates) {
          await supabase
            .from("tareas")
            .update({ orden: update.orden })
            .eq("id", update.id);
        }
      } catch (error) {
        console.error("Error actualizando orden:", error);
      }
    }
  };

  const crearNuevaTarea = async () => {
    // En lugar de crear directamente, abrir el panel vacío
    onTareaClick?.({
      id: null,
      nombre: "",
      descripcion: "",
      proceso_id: null,
      estado_id: null,
      prioridad: "media",
      empleado_asignado_id: null,
      fecha_limite: null,
      fecha_vencimiento: null,
      fecha_completada: null,
      tiempo_estimado: null,
      tiempo_real: null,
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
                label="Título"
                columnId="titulo"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <ColumnHeader
                label="Proceso"
                columnId="proceso"
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
                label="Prioridad"
                columnId="prioridad"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <ColumnHeader
                label="Asignado a"
                columnId="empleado"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <ColumnHeader
                label="Vencimiento"
                columnId="fecha_vencimiento"
                onSort={handleSort}
                currentSort={sortConfig}
              />
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b w-[60px]">
                👁️
              </th>
            </tr>
          </thead>
          <SortableContext
            items={tareas.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {tareas.map((tarea) => (
                <SortableRow
                  key={tarea.id}
                  tarea={tarea}
                  procesos={procesos}
                  estados={estados}
                  empleados={empleados}
                  actualizarCelda={actualizarCelda}
                  onTareaClick={onTareaClick}
                />
              ))}
              <tr className="border-t-2 border-gray-200">
                <td colSpan="8" className="p-0">
                  <button
                    onClick={crearNuevaTarea}
                    className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">+</span>
                    Nueva tarea
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

// Componente de fila sortable
function SortableRow({
  tarea,
  procesos,
  estados,
  empleados,
  actualizarCelda,
  onTareaClick,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-gray-50">
      <td className="px-2 py-2 text-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </td>
      <TextCell
        value={tarea.titulo}
        onChange={(val) => actualizarCelda(tarea.id, "titulo", val)}
        className="min-w-[250px]"
      />
      <SelectCell
        value={tarea.proceso?.nombre}
        options={procesos}
        onChange={(id) => actualizarCelda(tarea.id, "proceso_id", id)}
        className="min-w-[180px]"
      />
      <SelectCell
        value={tarea.estado?.nombre}
        options={estados}
        onChange={(id) => actualizarCelda(tarea.id, "estado_id", id)}
        badge
        color={tarea.estado?.color}
        className="min-w-[120px]"
      />
      <PrioridadCell
        value={tarea.prioridad}
        onChange={(val) => actualizarCelda(tarea.id, "prioridad", val)}
      />
      <SelectCell
        value={
          tarea.empleado_asignado
            ? `${tarea.empleado_asignado.nombre} ${tarea.empleado_asignado.apellido}`
            : ""
        }
        options={empleados.map((e) => ({
          id: e.id,
          nombre: `${e.nombre} ${e.apellido}`,
        }))}
        onChange={(id) => actualizarCelda(tarea.id, "empleado_id", id)}
        className="min-w-[150px]"
      />
      <DateCell
        value={tarea.fecha_vencimiento}
        onChange={(val) => actualizarCelda(tarea.id, "fecha_vencimiento", val)}
      />
      <td className="px-4 py-2 text-center">
        <button
          onClick={() => onTareaClick?.(tarea)}
          className="p-1 hover:bg-blue-100 rounded transition-colors"
          title="Ver detalles"
        >
          <span className="text-lg">👁️</span>
        </button>
      </td>
    </tr>
  );
}

// Componente de celda de texto editable
function TextCell({ value, onChange, className }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const contentRef = useRef();

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (editing && contentRef.current) {
      contentRef.current.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setCurrentValue(value || "");
          setEditing(false);
        }
      };

      contentRef.current.addEventListener("keydown", handleKeyDown);
      return () => {
        contentRef.current?.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [editing, value]);

  const handleSave = () => {
    setEditing(false);
    if (currentValue.trim() !== value) {
      onChange(currentValue.trim());
    }
  };

  return (
    <td className={clsx("px-4 py-2 group relative", className)}>
      <ContentEditable
        innerRef={contentRef}
        html={currentValue}
        disabled={!editing}
        onChange={(e) => setCurrentValue(e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={handleSave}
        className={clsx(
          "outline-none min-h-[32px] px-2 py-1 rounded transition-all",
          editing
            ? "bg-blue-50 ring-2 ring-blue-400"
            : "hover:bg-gray-100 cursor-text"
        )}
      />
    </td>
  );
}

// Componente de celda con dropdown
function SelectCell({ value, options, onChange, badge, color, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

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
    <td className={clsx("px-4 py-2 relative", className)}>
      <div
        ref={setReferenceElement}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "min-h-[32px] px-2 py-1 rounded cursor-pointer transition-all",
          isOpen ? "bg-blue-50 ring-2 ring-blue-400" : "hover:bg-gray-100",
          badge && "inline-flex items-center"
        )}
      >
        {badge && color ? (
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {value || "Seleccionar"}
          </span>
        ) : (
          <span className="text-sm">{value || "Seleccionar"}</span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-[9999] bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[200px] max-h-[300px] overflow-auto"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                {badge && option.color ? (
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
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
              </button>
            ))}
          </div>,
          document.body
        )}
    </td>
  );
}

// Componente de prioridad
function PrioridadCell({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  const prioridades = [
    { id: "alta", nombre: "Alta", color: "#EF4444" },
    { id: "media", nombre: "Media", color: "#F59E0B" },
    { id: "baja", nombre: "Baja", color: "#10B981" },
  ];

  const prioridadActual = prioridades.find((p) => p.id === value);

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
    <td className="px-4 py-2 relative min-w-[120px]">
      <div
        ref={setReferenceElement}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "min-h-[32px] px-2 py-1 rounded cursor-pointer transition-all inline-flex items-center",
          isOpen ? "bg-blue-50 ring-2 ring-blue-400" : "hover:bg-gray-100"
        )}
      >
        {prioridadActual ? (
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${prioridadActual.color}20`,
              color: prioridadActual.color,
            }}
          >
            {prioridadActual.nombre}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Seleccionar</span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-[9999] bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[150px]"
          >
            {prioridades.map((prioridad) => (
              <button
                key={prioridad.id}
                onClick={() => {
                  onChange(prioridad.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${prioridad.color}20`,
                    color: prioridad.color,
                  }}
                >
                  {prioridad.nombre}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </td>
  );
}

// Componente de fecha
function DateCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
      onChange(currentValue || null);
    }
  };

  return (
    <td className="px-4 py-2 min-w-[140px]">
      {editing ? (
        <input
          type="date"
          value={currentValue || ""}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setCurrentValue(value || "");
              setEditing(false);
            }
          }}
          autoFocus
          className="w-full px-2 py-1 text-sm border rounded bg-blue-50 ring-2 ring-blue-400 outline-none"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="min-h-[32px] px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-all flex items-center text-sm"
        >
          {value ? formatearFecha(value) : "Sin fecha"}
        </div>
      )}
    </td>
  );
}
