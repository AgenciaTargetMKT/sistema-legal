"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import toast from "react-hot-toast";

// ============================================
// HOOK: useTasksTable
// Lógica de estado y handlers para TareasTable
// ============================================

export function useTasksTable({ initialTareas, onUpdate, onTareasChange }) {
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

  // Ordenar tareas por fecha de vencimiento
  useEffect(() => {
    const tareasOrdenadas = [...(initialTareas || [])].sort((a, b) => {
      if (a.fecha_vencimiento && b.fecha_vencimiento) {
        return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
      }
      if (a.fecha_vencimiento && !b.fecha_vencimiento) return -1;
      if (!a.fecha_vencimiento && b.fecha_vencimiento) return 1;
      return 0;
    });
    setTareas(tareasOrdenadas);
  }, [initialTareas]);

  // Cargar catálogos
  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Suscripción para cambios en empleados designados
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
          const tareaId = payload.new?.tarea_id || payload.old?.tarea_id;
          if (tareaId) {
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_responsables",
        },
        async (payload) => {
          const tareaId = payload.new?.tarea_id || payload.old?.tarea_id;
          if (tareaId) {
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
  }, [onTareasChange]);

  // Suscripción para cambios en tareas
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
            if (!tareaExiste) return;

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
              setTareas((prev) => {
                const index = prev.findIndex(
                  (t) => t.id === tareaActualizada.id
                );
                if (index === -1) return prev;
                const newTareas = [...prev];
                newTareas[index] = tareaActualizada;
                setTimeout(() => onTareasChange?.(newTareas), 0);
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
                      await fetch("/api/calendar/events/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          taskId: tareaActualizada.id,
                          title: `${tareaActualizada.nombre || "Sin título"}`,
                          completed: true,
                        }),
                      });
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
  }, [onUpdate, tareas, onTareasChange]);

  // Resetear página cuando cambian tareas
  useEffect(() => {
    setPaginaActual(1);
  }, [elementosPorPagina, tareas.length]);

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
      if (empleadosRes.data) setEmpleados(empleadosRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

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
      const tareaOriginal = tareas.find((t) => t.id === tareaId);

      // Actualizar UI optimísticamente para campos simples
      if (campo !== "estado_id" && campo !== "proceso_id") {
        setTareas((prev) =>
          prev.map((t) => (t.id === tareaId ? { ...t, [campo]: valor } : t))
        );
      }

      const { error } = await supabase
        .from("tareas")
        .update({ [campo]: valor })
        .eq("id", tareaId);

      if (error) throw error;

      // Sincronizar nombre con calendario
      if (campo === "nombre" && valor) {
        const tarea = tareas.find((t) => t.id === tareaId);
        const nombreAnterior = tareaOriginal?.nombre || "";
        const deberiaSincronizarAhora = debeSincronizarConCalendario(valor);
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

              if (!sincronizabaAntes) {
                await fetch("/api/calendar/events/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: valor,
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
                    title: valor,
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

      // Sincronizar fecha con calendario
      if (campo === "fecha_vencimiento" && valor) {
        const tarea = tareas.find((t) => t.id === tareaId);

        if (!debeSincronizarConCalendario(tarea?.nombre)) return;

        const calendarioKey = `fecha-${tareaId}`;
        if (calendarioEnProgreso.current.has(calendarioKey)) return;

        calendarioEnProgreso.current.add(calendarioKey);

        try {
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
          setTimeout(() => {
            calendarioEnProgreso.current.delete(calendarioKey);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error actualizando:", error);
      setTareas((prev) => [...initialTareas]);
    }
  };

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
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const cambiarElementosPorPagina = (cantidad) => {
    setElementosPorPagina(cantidad);
    setPaginaActual(1);
  };

  // Calcular paginación
  const indexUltimo = paginaActual * elementosPorPagina;
  const indexPrimero = indexUltimo - elementosPorPagina;
  const tareasPaginadas = tareas.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(tareas.length / elementosPorPagina);

  return {
    // Estados
    tareas,
    estados,
    procesos,
    empleados,
    sortConfig,
    seleccionadas,
    paginaActual,
    elementosPorPagina,
    sensors,

    // Datos calculados
    tareasPaginadas,
    totalPaginas,
    indexPrimero,
    indexUltimo,

    // Handlers
    handleSort,
    handleDragEnd,
    actualizarCelda,
    toggleSeleccion,
    toggleSeleccionarTodas,
    eliminarSeleccionadas,
    cambiarPagina,
    cambiarElementosPorPagina,
  };
}
