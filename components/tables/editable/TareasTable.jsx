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
import toast from "react-hot-toast";
import ColumnHeader from "./ColumnHeader";

export default function TareasTable({
  tareas: initialTareas,
  onUpdate,
  onTareaClick,
  onTareasChange,
  hideControls = false,
}) {
  const [tareas, setTareas] = useState(initialTareas || []);
  const [procesos, setProcesos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [sortConfig, setSortConfig] = useState(null);
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(20);

  // Ref para prevenir llamadas duplicadas al calendario
  const calendarioEnProgreso = useRef(new Set());

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

  // Suscripción para cambios en empleados (forzar recarga de tarea afectada)
  useEffect(() => {
    const channel = supabase
      .channel("tareas-table-empleados")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_designados",
        },
        async (payload) => {
          console.log("👥 [TareasTable] Cambio en designados:", payload);
          const tareaId = payload.new?.tarea_id || payload.old?.tarea_id;
          if (tareaId) {
            // Esperar 600ms para que la BD procese el cambio completamente
            setTimeout(async () => {
              const { data: tareaActualizada } = await supabase
                .from("tareas")
                .select(
                  `
                  *,
                  proceso:procesos(id, nombre),
                  estado:estados_tarea(id, nombre, color, categoria),
                  cliente:clientes(id, nombre),
                  empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
                  empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
                `
                )
                .eq("id", tareaId)
                .single();

              if (tareaActualizada) {
                console.log(
                  "✅ [TareasTable] Tarea recargada con designados:",
                  tareaActualizada.empleados_designados
                );
                setTareas((prev) => {
                  const index = prev.findIndex((t) => t.id === tareaId);
                  if (index === -1) return prev;
                  const newTareas = [...prev];
                  newTareas[index] = tareaActualizada;
                  // Notificar cambios al padre
                  setTimeout(() => onTareasChange?.(newTareas), 0);
                  return newTareas;
                });
              }
            }, 600);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_responsables",
        },
        async (payload) => {
          console.log("👥 [TareasTable] Cambio en responsables:", payload);
          const tareaId = payload.new?.tarea_id || payload.old?.tarea_id;
          if (tareaId) {
            // Esperar 600ms para sincronización completa
            setTimeout(async () => {
              const { data: tareaActualizada } = await supabase
                .from("tareas")
                .select(
                  `
                  *,
                  proceso:procesos(id, nombre),
                  estado:estados_tarea(id, nombre, color, categoria),
                  cliente:clientes(id, nombre),
                  empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
                  empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
                `
                )
                .eq("id", tareaId)
                .single();

              if (tareaActualizada) {
                console.log(
                  "✅ [TareasTable] Recargando responsables para tarea:",
                  tareaId,
                  tareaActualizada.empleados_responsables
                );
                setTareas((prev) => {
                  const index = prev.findIndex((t) => t.id === tareaId);
                  if (index === -1) return prev;
                  const newTareas = [...prev];
                  newTareas[index] = tareaActualizada;
                  setTimeout(() => onTareasChange?.(newTareas), 0);
                  return newTareas;
                });
              }
            }, 600);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        async (payload) => {
          if (payload.eventType === "INSERT") {
            onUpdate?.();
          } else if (payload.eventType === "UPDATE") {
            const tareaExiste = tareas.some((t) => t.id === payload.new.id);
            if (!tareaExiste) {
              return;
            }

            const { data: tareaActualizada } = await supabase
              .from("tareas")
              .select(
                `
                *,
                proceso:procesos(id, nombre),
                estado:estados_tarea(id, nombre, color, categoria),
                cliente:clientes(id, nombre),
                empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
                empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (tareaActualizada) {
              console.log(
                "🔄 [TareasTable] Tarea actualizada:",
                tareaActualizada.id,
                "- Designados:",
                tareaActualizada.empleados_designados?.length || 0
              );

              setTareas((prev) => {
                const index = prev.findIndex(
                  (t) => t.id === tareaActualizada.id
                );
                if (index === -1) return prev;
                const newTareas = [...prev];
                newTareas[index] = tareaActualizada;
                setTimeout(() => {
                  onTareasChange?.(newTareas);
                }, 0);

                return newTareas;
              });

              // Si se marcó como finalizado, actualizar Google Calendar
              const estadoNombre = tareaActualizada.estado?.nombre
                ?.toLowerCase()
                .replace(/_/g, " ");
              if (
                estadoNombre === "finalizado" &&
                payload.old.estado_id !== payload.new.estado_id
              ) {
                if (debeSincronizarConCalendario(tareaActualizada.nombre)) {
                  const calendarioKey = `estado-${tareaActualizada.id}`;
                  if (!calendarioEnProgreso.current.has(calendarioKey)) {
                    calendarioEnProgreso.current.add(calendarioKey);

                    try {
                      const response = await fetch(
                        "/api/calendar/events/update",
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            taskId: tareaActualizada.id,
                            title: `${tareaActualizada.nombre || "Sin título"}`,
                            completed: true,
                          }),
                        }
                      );
                    } catch (calendarError) {
                      console.warn(
                        "Error actualizando estado en calendario:",
                        calendarError
                      );
                    } finally {
                      setTimeout(() => {
                        calendarioEnProgreso.current.delete(calendarioKey);
                      }, 1000);
                    }
                  }
                }
              }
            }
          } else if (payload.eventType === "DELETE") {
            setTareas((prev) => {
              const newTareas = prev.filter((t) => t.id !== payload.old.id);
              onTareasChange?.(newTareas);

              return newTareas;
            });
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
        case "nombre":
          aVal = a.nombre?.toLowerCase() || "";
          bVal = b.nombre?.toLowerCase() || "";
          break;
        case "estado":
          aVal = a.estado?.nombre?.toLowerCase() || "";
          bVal = b.estado?.nombre?.toLowerCase() || "";
          break;
        case "responsable":
          aVal = a.empleados_responsables?.[0]?.nombre?.toLowerCase() || "";
          bVal = b.empleados_responsables?.[0]?.nombre?.toLowerCase() || "";
          break;
        case "fecha_vencimiento":
          aVal = a.fecha_vencimiento || "";
          bVal = b.fecha_vencimiento || "";
          break;
        case "importancia":
          aVal = a.importancia?.toLowerCase() || "";
          bVal = b.importancia?.toLowerCase() || "";
          break;
        case "urgencia":
          aVal = a.urgencia?.toLowerCase() || "";
          bVal = b.urgencia?.toLowerCase() || "";
          break;
        case "notas":
          aVal = a.notas?.toLowerCase() || "";
          bVal = b.notas?.toLowerCase() || "";
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
        supabase.from("procesos").select("id, nombre").order("nombre"),
        supabase
          .from("estados_tarea")
          .select("id, nombre, color, categoria")
          .order("orden"),
        supabase
          .from("empleados")
          .select("id, nombre, apellido")
          .eq("activo", true)
          .order("nombre"),
      ]);

      if (procesosRes.data) setProcesos(procesosRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (empleadosRes.data) {
        setEmpleados(empleadosRes.data);
      }
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  // Función para verificar si una tarea debe sincronizarse con Google Calendar
  const debeSincronizarConCalendario = (nombreTarea) => {
    if (!nombreTarea) return false;
    const nombreUpper = nombreTarea.toUpperCase().trim();
    const palabrasClave = [
      "VENCIMIENTO",
      "SEGUIMIENTO",
      "AUDIENCIA",
      "REUNION",
      "REUNIÓN",
    ];
    return palabrasClave.some((palabra) => nombreUpper.startsWith(palabra));
  };

  const actualizarCelda = async (tareaId, campo, valor) => {
    try {
      // Guardar el valor anterior para revertir en caso de error
      const tareaOriginal = tareas.find((t) => t.id === tareaId);
      const valorAnterior = tareaOriginal?.[campo];

      // Actualizar UI optimísticamente solo para campos simples
      if (campo !== "estado_id" && campo !== "proceso_id") {
        setTareas((prev) =>
          prev.map((t) => (t.id === tareaId ? { ...t, [campo]: valor } : t))
        );
      }

      // Actualizar en base de datos
      const { error } = await supabase
        .from("tareas")
        .update({ [campo]: valor })
        .eq("id", tareaId);

      if (error) throw error;

      // Si se actualiza el nombre de la tarea, sincronizar con Google Calendar
      if (campo === "nombre" && valor) {
        const tarea = tareas.find((t) => t.id === tareaId);
        const nombreAnterior = tareaOriginal?.nombre || "";
        const nombreNuevo = valor;

        // Verificar si cambió de no-sincronizable a sincronizable
        const deberiaSincronizarAhora =
          debeSincronizarConCalendario(nombreNuevo);
        const sincronizabaAntes = debeSincronizarConCalendario(nombreAnterior);

        if (deberiaSincronizarAhora && tarea?.fecha_vencimiento) {
          const calendarioKey = `nombre-${tareaId}`;
          if (!calendarioEnProgreso.current.has(calendarioKey)) {
            calendarioEnProgreso.current.add(calendarioKey);

            try {
              const [year, month, day] = tarea.fecha_vencimiento.split("-");
              const fechaVencimiento = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                9,
                0,
                0
              );
              const fechaFin = new Date(fechaVencimiento);
              fechaFin.setHours(10, 0, 0, 0);

              // Si antes no sincronizaba, crear evento nuevo (conversión detectada)
              if (!sincronizabaAntes) {
                await fetch("/api/calendar/events/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: nombreNuevo,
                    description: tarea?.descripcion || "Tarea pendiente",
                    start: fechaVencimiento.toISOString(),
                    end: fechaFin.toISOString(),
                    taskId: tareaId,
                  }),
                });
              } else {
                await fetch("/api/calendar/events/update", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    taskId: tareaId,
                    title: nombreNuevo,
                  }),
                });
              }
            } catch (calendarError) {
              console.warn(
                "Error sincronizando nombre con calendario:",
                calendarError
              );
            } finally {
              setTimeout(() => {
                calendarioEnProgreso.current.delete(calendarioKey);
              }, 1000);
            }
          }
        }
      }

      // Si se actualiza fecha_vencimiento, también actualizar Google Calendar
      if (campo === "fecha_vencimiento" && valor) {
        const tarea = tareas.find((t) => t.id === tareaId);

        // Solo sincronizar si la tarea empieza con palabras clave
        if (!debeSincronizarConCalendario(tarea?.nombre)) {
          return;
        }

        // Prevenir llamadas duplicadas simultáneas
        const calendarioKey = `fecha-${tareaId}`;
        if (calendarioEnProgreso.current.has(calendarioKey)) {
          return;
        }

        calendarioEnProgreso.current.add(calendarioKey);

        try {
          // Crear fecha en hora local sin conversión de timezone
          const [year, month, day] = valor.split("-");
          const fechaVencimiento = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            9,
            0,
            0
          );
          const fechaFin = new Date(fechaVencimiento);
          fechaFin.setHours(10, 0, 0, 0);

          const response = await fetch("/api/calendar/events/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: tareaId,
              title: `${tarea?.nombre || "Sin título"}`,
              start: fechaVencimiento.toISOString(),
              end: fechaFin.toISOString(),
            }),
          });

          if (!response.ok && response.status === 404) {
            // Si no existe evento, crear uno nuevo

            await fetch("/api/calendar/events/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `${tarea?.nombre || "Sin título"}`,
                description: tarea?.descripcion || "Tarea pendiente",
                start: fechaVencimiento.toISOString(),
                end: fechaFin.toISOString(),
                taskId: tareaId,
              }),
            });
          }
        } catch (calendarError) {
          console.warn("Error actualizando calendario:", calendarError);
        } finally {
          // Limpiar el flag después de un pequeño delay
          setTimeout(() => {
            calendarioEnProgreso.current.delete(calendarioKey);
          }, 1000);
        }
      }

      // El realtime subscription se encargará de actualizar proceso, estado y empleado con sus relaciones completas
    } catch (error) {
      console.error("Error actualizando:", error);
      // Revertir cambio local si falla
      setTareas((prev) => [...initialTareas]);
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
      notas: "",
    });
  };

  const toggleSeleccion = (tareaId) => {
    setSeleccionadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(tareaId)) {
        nuevo.delete(tareaId);
      } else {
        nuevo.add(tareaId);
      }
      return nuevo;
    });
  };

  const toggleSeleccionarTodas = () => {
    // Filtrar tareas finalizadas
    const tareasSeleccionables = tareas.filter(
      (t) => t.estado?.categoria !== "completado"
    );

    if (seleccionadas.size === tareasSeleccionables.length) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(tareasSeleccionables.map((t) => t.id)));
    }
  };

  const eliminarSeleccionadas = async () => {
    if (seleccionadas.size === 0) return;

    // Filtrar tareas finalizadas - no se pueden eliminar
    const tareasAEliminar = tareas.filter(
      (t) => seleccionadas.has(t.id) && t.estado?.categoria !== "completado"
    );

    if (tareasAEliminar.length === 0) {
      toast.error("No se pueden eliminar tareas finalizadas");
      return;
    }

    const mensaje =
      tareasAEliminar.length === 1
        ? "¿Eliminar 1 tarea seleccionada?"
        : `¿Eliminar ${tareasAEliminar.length} tareas seleccionadas?`;

    if (!confirm(mensaje)) return;

    try {
      const tareasIds = tareasAEliminar.map((t) => t.id);

      // Eliminar eventos de Google Calendar para cada tarea
      for (const tareaId of tareasIds) {
        try {
          await fetch("/api/calendar/events/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: tareaId }),
          });
        } catch (calError) {
          console.warn(
            `Error eliminando evento de calendario para tarea ${tareaId}:`,
            calError
          );
        }
      }

      // Eliminar tareas de la base de datos
      const { error } = await supabase
        .from("tareas")
        .delete()
        .in("id", tareasIds);

      if (error) throw error;

      setSeleccionadas(new Set());
      toast.success(`${tareasIds.length} tarea(s) eliminada(s) exitosamente`);
      onUpdate?.();
    } catch (error) {
      console.error("Error eliminando tareas:", error);
      alert("Error al eliminar: " + error.message);
    }
  };

  // Calcular paginación
  const indexUltimo = paginaActual * elementosPorPagina;
  const indexPrimero = indexUltimo - elementosPorPagina;
  const tareasPaginadas = tareas.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(tareas.length / elementosPorPagina);

  // Resetear a página 1 cuando cambian las tareas o elementos por página
  useEffect(() => {
    setPaginaActual(1);
  }, [elementosPorPagina, tareas.length]);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const cambiarElementosPorPagina = (cantidad) => {
    setElementosPorPagina(cantidad);
    setPaginaActual(1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de selección múltiple */}
      {seleccionadas.size > 0 && (
        <div className="px-5 py-3 bg-linear-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl flex items-center justify-between shadow-sm">
          <span className="text-sm text-primary-900 font-semibold">
            {seleccionadas.size} tarea{seleccionadas.size !== 1 ? "s" : ""}{" "}
            seleccionada{seleccionadas.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={eliminarSeleccionadas}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="w-full overflow-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead className="bg-linear-to-r from-slate-50 via-blue-50 to-indigo-50 sticky top-0 z-10 border-b-2 border-gray-200">
              <tr>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 w-8">
                  <input
                    type="checkbox"
                    checked={
                      tareas.length > 0 &&
                      seleccionadas.size ===
                        tareas.filter(
                          (t) => t.estado?.categoria !== "completado"
                        ).length &&
                      tareas.filter((t) => t.estado?.categoria !== "completado")
                        .length > 0
                    }
                    onChange={toggleSeleccionarTodas}
                    className="cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 w-8">
                  <GripVertical className="w-4 h-4 mx-auto text-gray-400" />
                </th>
                <ColumnHeader
                  label="Nombre"
                  columnId="nombre"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 border-r border-gray-200 w-32">
                  <div className="flex items-center gap-2">
                    <span>Estado</span>
                  </div>
                </th>
                <ColumnHeader
                  label="Responsables"
                  columnId="responsable"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Vencimiento"
                  columnId="fecha_vencimiento"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Importancia"
                  columnId="importancia"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Urgencia"
                  columnId="urgencia"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
                <ColumnHeader
                  label="Personas Asignadas"
                  columnId="personas_asignadas"
                  onSort={handleSort}
                  currentSort={sortConfig}
                />
              </tr>
            </thead>
            <SortableContext
              items={tareasPaginadas.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {tareasPaginadas.map((tarea) => (
                  <SortableRow
                    key={tarea.id}
                    tarea={tarea}
                    procesos={procesos}
                    estados={estados}
                    empleados={empleados}
                    actualizarCelda={actualizarCelda}
                    onTareaClick={onTareaClick}
                    seleccionada={seleccionadas.has(tarea.id)}
                    onToggleSeleccion={toggleSeleccion}
                  />
                ))}
              </tbody>
            </SortableContext>
            <tbody>
              <tr className="hover:bg-blue-50/20 group">
                <td colSpan="9" className="px-3 py-2.5">
                  <button
                    onClick={crearNuevaTarea}
                    className="w-full text-left text-sm text-gray-400 hover:text-primary-600 transition-colors flex items-center gap-2 py-1"
                  >
                    <span className="text-base">+</span>
                    <span>Agregar tarea</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Paginación inferior - Compacta */}
      {!hideControls && tareas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Selector e info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Mostrar</span>
            <select
              value={elementosPorPagina}
              onChange={(e) =>
                cambiarElementosPorPagina(Number(e.target.value))
              }
              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-400 focus:border-primary-400 outline-none bg-white hover:border-gray-400 transition-colors"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500">
              {indexPrimero + 1}-{Math.min(indexUltimo, tareas.length)} de{" "}
              {tareas.length}
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

            <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
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

// Componente de fila sortable
function SortableRow({
  tarea,
  procesos,
  estados,
  empleados,
  actualizarCelda,
  onTareaClick,
  seleccionada,
  onToggleSeleccion,
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

  // Verificar si la tarea está finalizada
  const estaFinalizada = tarea.estado?.categoria === "completado";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={clsx(
        "border-b border-gray-100 hover:bg-blue-50/30 group transition-colors",
        estaFinalizada && "bg-green-50/50 opacity-70"
      )}
    >
      <td className="px-1 py-1.5 text-center border-r">
        <input
          type="checkbox"
          checked={seleccionada}
          onChange={() => onToggleSeleccion(tarea.id)}
          disabled={estaFinalizada}
          className={clsx(
            "w-4 h-4",
            estaFinalizada ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
        />
      </td>
      <td className="px-1 py-1.5 text-center border-r">
        <div
          {...(estaFinalizada ? {} : attributes)}
          {...(estaFinalizada ? {} : listeners)}
          className={clsx(
            "flex items-center justify-center",
            estaFinalizada
              ? "cursor-not-allowed text-gray-300"
              : "cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          )}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </td>
      {/* Nombre */}
      <TextCell
        value={tarea.nombre}
        onChange={(val) => actualizarCelda(tarea.id, "nombre", val)}
        disabled={estaFinalizada}
        bold={true}
        iconButton={
          <button
            onClick={() => onTareaClick?.(tarea)}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-primary-600  rounded-md transition-all opacity-0 group-hover:opacity-100"
            title="Abrir panel de detalles"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
            <span>Abrir</span>
          </button>
        }
      />
      {/* Estado */}
      <EstadoCell
        value={tarea.estado_id}
        estadoActual={tarea.estado}
        estados={estados}
        onChange={(id) => actualizarCelda(tarea.id, "estado_id", id)}
        disabled={estaFinalizada}
        className="min-w-[130px] text-sm"
      />
      {/* Responsable (editable) */}
      <EmpleadosDisplay
        empleados={tarea.empleados_responsables || []}
        onTareaClick={() => onTareaClick?.(tarea)}
        disabled={estaFinalizada}
      />
      {/* Fecha Vencimiento */}
      <DateCell
        value={tarea.fecha_vencimiento}
        onChange={(val) => actualizarCelda(tarea.id, "fecha_vencimiento", val)}
        disabled={estaFinalizada}
      />
      {/* Importancia */}
      <BadgeCell
        value={tarea.importancia}
        options={[
          { id: "importante", nombre: "Importante", color: "#EF4444" },
          { id: "no importante", nombre: "No importante", color: "#10B981" },
        ]}
        disabled={estaFinalizada}
        onChange={(val) => actualizarCelda(tarea.id, "importancia", val)}
      />
      {/* Urgencia */}
      <BadgeCell
        value={tarea.urgencia}
        options={[
          { id: "urgente", nombre: "Urgente", color: "#F59E0B" },
          { id: "no urgente", nombre: "No urgente", color: "#3B82F6" },
        ]}
        disabled={estaFinalizada}
        onChange={(val) => actualizarCelda(tarea.id, "urgencia", val)}
      />
      {/* Personas Asignadas (Designados) - Usando EmpleadosDisplay igual que Responsables */}
      <EmpleadosDisplay
        empleados={tarea.empleados_designados || []}
        onTareaClick={() => onTareaClick?.(tarea)}
        disabled={estaFinalizada}
      />
    </tr>
  );
}

// Componente de celda de texto editable
function TextCell({
  value,
  onChange,
  className,
  iconButton,
  disabled = false,
  bold = false,
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const inputRef = useRef();

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    const trimmed = currentValue.trim();
    if (trimmed !== (value || "").trim()) {
      onChange(trimmed);
    }
  };

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

  return (
    <td className={clsx("px-3 py-1.5 border-r group relative", className)}>
      <div className="flex items-center gap-2 min-w-[200px]">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-0.5 text-xs border-2 border-primary-400 rounded bg-primary-50 outline-none"
          />
        ) : (
          <div
            onClick={() => !disabled && setEditing(true)}
            className={clsx(
              "flex-1 px-2 py-0.5 text-xs rounded transition-colors min-h-6 flex items-center",
              disabled
                ? "cursor-not-allowed text-gray-500"
                : "hover:bg-gray-100 cursor-text",
              bold && "font-semibold text-gray-900"
            )}
          >
            {currentValue || (
              <span className="text-gray-400 font-normal">Vacío</span>
            )}
          </div>
        )}
        {iconButton}
      </div>
    </td>
  );
}
// Componente de celda con dropdown agrupado por categorías (para estados)
function EstadoCell({
  value,
  estadoActual: estadoActualProp,
  estados,
  onChange,
  className,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  // Usar el estado de la prop si está disponible, sino buscar en la lista
  const estadoActual = estadoActualProp || estados.find((e) => e.id === value);

  // Agrupar estados por categoría
  const estadosAgrupados = {
    pendiente: estados.filter((e) => e.categoria === "pendiente"),
    en_curso: estados.filter((e) => e.categoria === "en_curso"),
    completado: estados.filter((e) => e.categoria === "completado"),
    vacio: estados.filter((e) => e.categoria === "vacio"),
  };

  const categorias = [
    { key: "pendiente", label: "Pendiente" },
    { key: "en_curso", label: "En curso" },
    { key: "completado", label: "Completado" },
    { key: "vacio", label: "Vacío" },
  ];

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
    <td className={clsx("px-3 py-1.5 border-r relative", className)}>
      <div
        ref={setReferenceElement}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "inline-flex items-center",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        {estadoActual ? (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
              !disabled && "hover:opacity-80"
            )}
            style={{
              backgroundColor: `${estadoActual.color}20`,
              color: estadoActual.color,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: estadoActual.color }}
            />
            {estadoActual.nombre.charAt(0).toUpperCase() +
              estadoActual.nombre.slice(1).replace(/_/g, " ")}
          </span>
        ) : (
          <span className="text-xs text-gray-400 px-2 py-1">Seleccionar</span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-9999 bg-white border border-gray-200 shadow-xl rounded-xl py-1 min-w-40 max-h-[400px] overflow-y-auto"
          >
            {categorias.map((categoria) => {
              const estadosCategoria = estadosAgrupados[categoria.key];
              if (estadosCategoria.length === 0) return null;

              return (
                <div key={categoria.key} className="mb-1 last:mb-0">
                  <div className="px-3 py-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {categoria.label}
                  </div>
                  {estadosCategoria.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => {
                        onChange(estado.id);
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-1 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${estado.color}20`,
                          color: estado.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: estado.color }}
                        />
                        {estado.nombre.charAt(0).toUpperCase() +
                          estado.nombre.slice(1).replace(/_/g, " ")}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </td>
  );
}

// Componente de celda con badge selector (para Importancia/Urgencia)
function BadgeCell({ value, options, onChange, className, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  const opcionActual = options.find((opt) => opt.id === value);

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
    <td className={clsx("px-3 py-1.5 border-r relative", className)}>
      <div
        ref={setReferenceElement}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "inline-flex items-center",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        {opcionActual ? (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
              !disabled && "hover:opacity-80"
            )}
            style={{
              backgroundColor: `${opcionActual.color}20`,
              color: opcionActual.color,
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: opcionActual.color }}
            />
            {opcionActual.nombre}
          </span>
        ) : (
          <span className="text-xs text-gray-400 px-2 py-1">Seleccionar</span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-9999 bg-white border border-gray-200 shadow-xl rounded-xl py-1 min-w-[180px]"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${option.color}20`,
                    color: option.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.nombre}
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
function DateCell({ value, onChange, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    // Parsear fecha sin conversión UTC
    const [year, month, day] = fecha.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
      // Asegurar que la fecha se guarde correctamente sin problemas de timezone
      const fechaCorregida = currentValue ? currentValue : null;
      onChange(fechaCorregida);
    }
  };

  return (
    <td className="px-3 py-1.5 border-r min-w-[120px]">
      {editing && !disabled ? (
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
          className="w-full px-2 py-0.5 text-xs border rounded bg-primary-50 ring-2 ring-primary-400 outline-none"
        />
      ) : (
        <div
          onClick={() => !disabled && setEditing(true)}
          className={clsx(
            "min-h-6 px-2 py-0.5 rounded transition-all flex items-center text-xs",
            disabled
              ? "cursor-not-allowed text-gray-500"
              : "hover:bg-gray-100 cursor-pointer"
          )}
        >
          {value ? formatearFecha(value) : "Sin fecha"}
        </div>
      )}
    </td>
  );
}

// Componente de celda con select (para Responsables)
function SelectCell({
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  className,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
  });

  const opcionSeleccionada = options.find((opt) => opt.id === value);

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
    <td className={clsx("px-3 py-1.5 border-r relative", className)}>
      <div
        ref={setReferenceElement}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "min-h-6 px-2 py-0.5 rounded transition-all flex items-center text-xs truncate",
          disabled
            ? "cursor-not-allowed opacity-60 bg-gray-50"
            : "hover:bg-gray-100 cursor-pointer"
        )}
      >
        {opcionSeleccionada ? (
          <span className="text-gray-900">{opcionSeleccionada.nombre}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-9999 bg-white border border-gray-200 shadow-xl rounded-xl py-1 min-w-[200px] max-h-[300px] overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors",
                  value === option.id && "bg-blue-50 font-medium"
                )}
              >
                {option.nombre}
              </button>
            ))}
          </div>,
          document.body
        )}
    </td>
  );
}

// Componente para mostrar empleados como badges coloridos
function EmpleadosDisplay({ empleados, onTareaClick, disabled }) {
  // Función para generar color único basado en ID del empleado
  const getEmpleadoColor = (empleadoId, nombreEmpleado = "") => {
    const colores = [
      { bg: "#DBEAFE", text: "#2563EB" }, // Azul
      { bg: "#D1FAE5", text: "#059669" }, // Verde
      { bg: "#FEF3C7", text: "#D8A66CFF" }, // Naranja
      { bg: "#EDE9FE", text: "#7C3AED" }, // Púrpura
      { bg: "#FCE7F3", text: "#DB2777" }, // Rosa
      { bg: "#BAE6FD", text: "#0284C7" }, // Azul claro
      { bg: "#FED7AA", text: "#D78559FF" }, // Naranja claro
      { bg: "#A7F3D0", text: "#047857" }, // Verde claro
      { bg: "#FEE2E2", text: "#DC2626" }, // Rojo
      { bg: "#C7D2FE", text: "#4338CA" }, // Índigo
    ];

    // Convertir UUID a número para el hash
    let hash = 0;
    const idStr = String(empleadoId || nombreEmpleado || "default");

    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32bit integer
    }

    // Usar multiplicación dorada para mejor distribución
    hash = Math.abs(hash);
    const index = (hash * 2654435761) % colores.length;

    return colores[index];
  };

  const empleadosArray = Array.isArray(empleados) ? empleados : [];
  const empleadosValidos = empleadosArray.filter(
    (emp) => emp && (emp.empleado?.nombre || emp.nombre)
  );

  return (
    <td className="px-3 py-1.5 border-r relative group">
      <div className="flex flex-wrap gap-1 min-w-[150px]">
        {empleadosValidos.length > 0 ? (
          empleadosValidos.map((item, index) => {
            const empleado = item.empleado || item;
            const nombre = empleado.nombre
              ? empleado.nombre.split(" ")[0]
              : "Sin nombre";
            const colorObj = getEmpleadoColor(empleado.id, empleado.nombre);

            return (
              <span
                key={empleado.id || index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colorObj.bg,
                  color: colorObj.text,
                }}
              >
                {nombre}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-gray-400">Sin responsables</span>
        )}

        {/* Botón para abrir panel (visible en hover) */}
        <button
          onClick={() => onTareaClick?.()}
          className="ml-1 text-gray-300 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Editar responsables"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
      </div>
    </td>
  );
}
