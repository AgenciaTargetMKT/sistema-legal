"use client";

import { useState } from "react";
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
  FileText,
  Calendar,
  User,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatearFecha } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Componente de fila arrastrable
function SortableRow({ proceso, onClick, onEditar, onEliminar }) {
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

  const getEstadoColor = (estadoNombre) => {
    const colores = {
      activo: "bg-green-100 text-green-800",
      concluido: "bg-gray-100 text-gray-800",
      archivado: "bg-blue-100 text-blue-800",
      suspendido: "bg-yellow-100 text-yellow-800",
    };
    return colores[estadoNombre?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="p-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded hover:scale-110 transition-transform inline-block"
        >
          <GripVertical className="h-7 w-7 text-gray-400" />
        </div>
      </td>
      <td className="p-3">
        <div className="font-medium text-gray-900">
          {proceso.numero_proceso}
        </div>
        <div className="text-sm text-gray-600 truncate max-w-xs">
          {proceso.nombre}
        </div>
      </td>
      <td className="p-3">
        <div className="text-sm">
          {proceso.cliente?.nombre || "Sin cliente"}
        </div>
        <div className="text-xs text-gray-500">
          {proceso.cliente?.documento_identidad}
        </div>
      </td>
      <td className="p-3">
        <div className="text-sm">{proceso.materia?.nombre || "-"}</div>
      </td>
      <td className="p-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEstadoColor(
            proceso.estado_general
          )}`}
        >
          {proceso.estado_general || "Sin estado"}
        </span>
      </td>
      <td className="p-3">
        <div className="text-sm text-gray-600">
          {proceso.fecha_inicio ? formatearFecha(proceso.fecha_inicio) : "-"}
        </div>
      </td>
      <td className="p-3">
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEditar(proceso);
            }}
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEliminar(proceso);
            }}
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
  onEditar,
  onEliminar,
}) {
  const [items, setItems] = useState(procesos);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
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
      {/* Tabla */}
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
              style={{ minWidth: "2000px" }}
            >
              <thead className="bg-gray-50/80 border-b sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16"></th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                    Impulso
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">
                    Procesos Judiciales
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[180px]">
                    Cliente
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                    ROL
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[150px]">
                    VS.
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[150px]">
                    Materia
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[200px]">
                    Pretensiones
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[180px]">
                    Dependencia
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">
                    Estado
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">
                    Tipo de PP
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[300px]">
                    Última Actuación Estado
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[100px]">
                    Fecha
                  </th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-[120px]">
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
                    <SortableRow
                      key={proceso.id}
                      proceso={proceso}
                      onClick={() => onProcesoClick?.(proceso)}
                      onEditar={onEditar}
                      onEliminar={onEliminar}
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
