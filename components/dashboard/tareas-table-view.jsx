"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha, estaVencido } from "@/lib/utils";
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
import {
  GripVertical,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente de fila arrastrable
function SortableRow({ tarea, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "default",
  };

  const vencida =
    tarea.fecha_vencimiento &&
    estaVencido(tarea.fecha_vencimiento) &&
    tarea.estado?.nombre?.toLowerCase() !== "completada";

  const getPrioridadColor = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-700 border-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "baja":
        return "bg-green-100 text-green-700 border-green-200";
      case "urgente":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-blue-50/30 transition-all ${
        vencida ? "bg-red-50/30" : ""
      } ${
        isDragging ? "shadow-2xl bg-white border-2 border-blue-500 z-50" : ""
      }`}
    >
      {/* Drag Handle - ÁREA MÁS GRANDE Y VISIBLE */}
      <td className="py-2 px-2 bg-gray-50/50">
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-blue-100 hover:scale-110 rounded-lg p-3 transition-all duration-200 group flex items-center justify-center border-2 border-transparent hover:border-blue-300"
          title="🖱️ Arrastra para reordenar"
        >
          <GripVertical className="h-7 w-7 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </td>

      {/* Título */}
      <td className="py-3 px-4 min-w-[250px]">
        <div className="font-medium text-gray-900">{tarea.nombre}</div>
        {tarea.descripcion && (
          <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">
            {tarea.descripcion}
          </div>
        )}
      </td>

      {/* Estado */}
      <td className="py-3 px-4">
        {tarea.estado && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${tarea.estado.color}20`,
              color: tarea.estado.color,
            }}
          >
            {tarea.estado.nombre}
          </span>
        )}
      </td>

      {/* Prioridad */}
      <td className="py-3 px-4">
        {tarea.prioridad && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPrioridadColor(
              tarea.prioridad
            )}`}
          >
            {tarea.prioridad}
          </span>
        )}
      </td>

      {/* Proceso */}
      <td className="py-3 px-4">
        {tarea.proceso && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate max-w-[150px]">
              {tarea.proceso.numero_proceso}
            </span>
          </div>
        )}
      </td>

      {/* Asignado a */}
      <td className="py-3 px-4">
        {tarea.empleado_asignado && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <User className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">
              {tarea.empleado_asignado.nombre}
            </span>
          </div>
        )}
      </td>

      {/* Fecha Vencimiento */}
      <td className="py-3 px-4">
        {tarea.fecha_vencimiento && (
          <div
            className={`flex items-center gap-1.5 text-sm ${
              vencida ? "text-red-600 font-medium" : "text-gray-600"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatearFecha(tarea.fecha_vencimiento)}</span>
            {vencida && <AlertCircle className="h-3.5 w-3.5" />}
          </div>
        )}
      </td>

      {/* Acciones */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tarea)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(tarea)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Componente principal de tabla
export default function TareasTableView({ tareas, onEdit, onReorder }) {
  const [items, setItems] = useState(tareas);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Reducir distancia para que sea más sensible
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar items cuando cambian las tareas
  useEffect(() => {
    setItems(tareas);
  }, [tareas]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Actualizar orden en la base de datos
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          orden: index + 1,
        }));

        // Actualizar cada tarea con su nuevo orden
        for (const update of updates) {
          await supabase
            .from("tareas")
            .update({ orden: update.orden })
            .eq("id", update.id);
        }

        onReorder?.(newItems);
      } catch (error) {
        console.error("Error al actualizar orden:", error);
        // Revertir cambios en caso de error
        setItems(items);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTarea = items.find((tarea) => tarea.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  <GripVertical className="h-4 w-4 mx-auto text-gray-400" />
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarea
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proceso
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={items.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((tarea) => (
                  <SortableRow key={tarea.id} tarea={tarea} onEdit={onEdit} />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeTarea ? (
          <div className="bg-white shadow-2xl rounded-lg p-6 opacity-95 border-4 border-blue-500 min-w-[400px]">
            <div className="flex items-center gap-3 mb-2">
              <GripVertical className="h-6 w-6 text-blue-600" />
              <div className="font-bold text-lg">{activeTarea.nombre}</div>
            </div>
            {activeTarea.descripcion && (
              <div className="text-sm text-gray-600 ml-9">
                {activeTarea.descripcion}
              </div>
            )}
            <div className="text-xs text-blue-600 font-medium mt-3 ml-9">
              ↕️ Arrastrando...
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
