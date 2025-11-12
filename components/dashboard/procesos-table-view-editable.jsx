"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Eye, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatearFecha } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Celda editable inline
function EditableCell({
  value,
  onSave,
  onClick,
  className = "",
  type = "text",
  options = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const handleSave = async () => {
    if (editValue !== value) {
      await onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    if (type === "select") {
      return (
        <div className="flex items-center gap-1">
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          >
            <option value="">Seleccionar...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "date") {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full text-sm"
            autoFocus
          />
        </div>
      );
    }

    if (type === "checkbox") {
      return (
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={editValue === true || editValue === "true"}
            onChange={(e) => {
              setEditValue(e.target.checked);
              onSave(e.target.checked);
              setIsEditing(false);
            }}
            className="w-4 h-4"
            autoFocus
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full text-sm"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          onClick();
        } else {
          setIsEditing(true);
        }
      }}
    >
      {value || <span className="text-gray-400 text-sm italic">Vacío</span>}
    </div>
  );
}

// Componente de fila arrastrable y editable
function EditableRow({
  proceso,
  onUpdate,
  onDelete,
  onProcesoClick,
  clientes,
  materias,
  estados,
  tipos,
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

  const handleUpdateField = async (field, value) => {
    try {
      const { error } = await supabase
        .from("procesos")
        .update({ [field]: value })
        .eq("id", proceso.id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al actualizar: " + error.message);
    }
  };

  const getEstadoStyle = (estado) => {
    if (!estado?.color) {
      return {
        backgroundColor: "#f3f4f6",
        color: "#374151",
      };
    }
    return {
      backgroundColor: `${estado.color}20`,
      color: estado.color,
      borderColor: estado.color,
    };
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-gray-50/50 transition-colors group"
    >
      {/* Grip */}
      <td className="p-2 w-12">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-all"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </td>

      {/* Impulso */}
      <td className="p-2 text-center w-20">
        <EditableCell
          value={proceso.impulso}
          type="checkbox"
          onSave={(val) => handleUpdateField("impulso", val)}
        />
      </td>

      {/* Procesos Judiciales (Número + Nombre) */}
      <td className="p-2 w-[250px]">
        <EditableCell
          value={proceso.numero_proceso}
          onSave={(val) => handleUpdateField("numero_proceso", val)}
          className="font-semibold text-sm mb-1"
        />
        <EditableCell
          value={proceso.nombre}
          onSave={(val) => handleUpdateField("nombre", val)}
          className="text-xs text-gray-600"
        />
      </td>

      {/* Cliente */}
      <td className="p-2 w-[200px]">
        <EditableCell
          value={proceso.cliente?.nombre || "Sin cliente"}
          onClick={() =>
            alert("Para cambiar cliente, usa el diálogo de edición")
          }
          className="text-sm"
        />
      </td>

      {/* VS. (Contraparte) */}
      <td className="p-2 w-[180px]">
        <EditableCell
          value={proceso.contra_parte}
          onSave={(val) => handleUpdateField("contra_parte", val)}
          className="text-sm"
        />
      </td>

      {/* Materia */}
      <td className="p-2 w-[150px]">
        <div className="text-sm text-gray-700">
          {proceso.materia?.nombre || "-"}
        </div>
      </td>

      {/* Pretensiones */}
      <td className="p-2 w-[250px]">
        <EditableCell
          value={proceso.pretensiones}
          onSave={(val) => handleUpdateField("pretensiones", val)}
          className="text-sm text-gray-600"
        />
      </td>

      {/* Dependencia */}
      <td className="p-2 w-[180px]">
        <EditableCell
          value={proceso.dependencia}
          onSave={(val) => handleUpdateField("dependencia", val)}
          className="text-sm"
        />
      </td>

      {/* Estado */}
      <td className="p-2 w-[120px]">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border"
          style={getEstadoStyle(proceso.estado)}
        >
          {proceso.estado?.nombre || "Sin estado"}
        </div>
      </td>

      {/* Tipo de Proceso */}
      <td className="p-2 w-[120px]">
        <div className="text-sm text-gray-700">
          {proceso.tipo_proceso?.nombre || "-"}
        </div>
      </td>

      {/* Fecha */}
      <td className="p-2 w-[120px]">
        <EditableCell
          value={proceso.fecha_inicio}
          type="date"
          onSave={(val) => handleUpdateField("fecha_inicio", val)}
          className="text-sm text-gray-600"
        />
      </td>

      {/* Acciones */}
      <td className="p-2 w-[100px]">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onProcesoClick(proceso)}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(proceso)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ProcesosTableView({
  procesos,
  onUpdate,
  onProcesoClick,
  onEliminar,
}) {
  const [items, setItems] = useState(procesos);
  const [activeId, setActiveId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    setItems(procesos);
  }, [procesos]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const [clientesRes, materiasRes, estadosRes, tiposRes] = await Promise.all([
      supabase.from("clientes").select("id, nombre").order("nombre"),
      supabase.from("materias").select("id, nombre").order("nombre"),
      supabase
        .from("estados_proceso")
        .select("id, nombre, color")
        .order("nombre"),
      supabase.from("tipos_proceso").select("id, nombre").order("nombre"),
    ]);

    if (clientesRes.data) setClientes(clientesRes.data);
    if (materiasRes.data) setMaterias(materiasRes.data);
    if (estadosRes.data) setEstados(estadosRes.data);
    if (tiposRes.data) setTipos(tiposRes.data);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          orden: index,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from("procesos")
            .update({ orden: update.orden })
            .eq("id", update.id);

          if (error) throw error;
        }

        onUpdate?.();
      } catch (error) {
        console.error("Error al actualizar orden:", error);
        setItems(procesos);
      }
    }

    setActiveId(null);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className="space-y-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed"
              style={{ minWidth: "1800px" }}
            >
              <thead className="bg-gray-50/80 border-b sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-12"></th>
                  <th className="p-2 text-center text-xs font-semibold text-gray-700 uppercase w-20">
                    Impulso
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[250px]">
                    Procesos Judiciales
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[200px]">
                    Cliente
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[180px]">
                    VS.
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[150px]">
                    Materia
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[250px]">
                    Pretensiones
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[180px]">
                    Dependencia
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[120px]">
                    Estado
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[120px]">
                    Tipo de PP
                  </th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-700 uppercase w-[120px]">
                    Fecha
                  </th>
                  <th className="p-2 text-center text-xs font-semibold text-gray-700 uppercase w-[100px]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <SortableContext
                  items={items.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((proceso) => (
                    <EditableRow
                      key={proceso.id}
                      proceso={proceso}
                      onUpdate={onUpdate}
                      onDelete={onEliminar}
                      onProcesoClick={onProcesoClick}
                      clientes={clientes}
                      materias={materias}
                      estados={estados}
                      tipos={tipos}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="bg-white shadow-lg rounded-lg p-4 opacity-90 border-2 border-primary">
                <div className="font-medium">{activeItem.numero_proceso}</div>
                <div className="text-sm text-gray-600">{activeItem.nombre}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
