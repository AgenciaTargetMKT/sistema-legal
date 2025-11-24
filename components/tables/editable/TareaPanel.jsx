"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import ContentEditable from "react-contenteditable";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import toast from "react-hot-toast";
import { X, Calendar, User, FileText, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";

export default function TareaPanel({ tarea, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Estado local para tarea actualizada optimísticamente
  const [tareaLocal, setTareaLocal] = useState(null);

  // Estado local SOLO para el título (evita actualizar DB en cada tecla)
  const [tituloLocal, setTituloLocal] = useState("");
  const valorAnteriorTitulo = useRef("");

  // Ref para prevenir llamadas duplicadas al calendario
  const calendarioEnProgreso = useRef(new Set());

  // Estados de carga
  const [catalogosCargados, setCatalogosCargados] = useState(false);

  // Catálogos
  const [procesos, setProcesos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Estado temporal SOLO para nueva tarea (antes de guardar)
  const [nuevaTareaTemp, setNuevaTareaTemp] = useState(null);

  // Estado para tipo de evento (todo el día o con hora)
  const [esTodoElDia, setEsTodoElDia] = useState(true);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");

  // Sincronizar tareaLocal con tarea cuando cambia
  useEffect(() => {
    if (tarea?.id) {
      setTareaLocal(tarea);
    } else {
      setTareaLocal(null);
    }
  }, [tarea]);

  // Inicializar cuando se abre el panel (solo una vez)
  useEffect(() => {
    if (isOpen && !nuevaTareaTemp && !tarea?.id) {
      // Modo creación: inicializar estado temporal

      setNuevaTareaTemp({
        nombre: "",
        descripcion: "",
        notas: "",
        importancia: "no importante",
        urgencia: "no urgente",
        fecha_vencimiento: null,
        proceso_id: null,
        cliente_id: null,
        estado_id: null,
        empleados_designados: [],
        empleados_responsables: [],
      });
      setTituloLocal("");
      valorAnteriorTitulo.current = "";
      if (!catalogosCargados) {
        cargarCatalogos();
        cargarUsuarioActual();
      }
    } else if (isOpen && tarea?.id) {
      // Modo edición: inicializar título solo la primera vez

      if (!tituloLocal) {
        setTituloLocal(tarea?.nombre || "");
        valorAnteriorTitulo.current = tarea?.nombre || "";
      }
      setNuevaTareaTemp(null);
      if (!catalogosCargados) {
        cargarCatalogos();
        cargarUsuarioActual();
      }
      // Cargar empleados desde las tablas de relación
      cargarEmpleadosTarea(tarea.id);
    }

    if (!isOpen) {
      setNuevaTareaTemp(null);
      setTituloLocal("");
      valorAnteriorTitulo.current = "";
      setTareaLocal(null);
    }
  }, [isOpen, tarea?.id]); // Solo escuchar cambios en isOpen y tarea?.id

  // Sincronizar título cuando tarea cambia (solo en modo edición y si el panel está abierto)
  useEffect(() => {
    if (isOpen && tarea?.id && tarea?.nombre !== tituloLocal) {
      setTituloLocal(tarea.nombre || "");
      valorAnteriorTitulo.current = tarea.nombre || "";
    }
  }, [tarea?.nombre, isOpen, tarea?.id]);

  // Cargar catálogos al inicializar el componente
  useEffect(() => {
    if (!catalogosCargados) {
      cargarCatalogos();
      cargarUsuarioActual();
    }
  }, [catalogosCargados]);

  const cargarUsuarioActual = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: empleado } = await supabase
          .from("empleados")
          .select("id, nombre, apellido")
          .eq("auth_user_id", user.id)
          .single();

        if (empleado) {
          setUsuarioActual(empleado);
          // Si es una nueva tarea, agregar el usuario actual como responsable por defecto
          if (!tarea?.id && nuevaTareaTemp) {
            setNuevaTareaTemp((prev) => ({
              ...prev,
              empleados_responsables: [empleado],
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error cargando usuario actual:", error);
    }
  };

  const cargarEmpleadosTarea = async (tareaId) => {
    try {
      // Cargar designados
      const { data: designados } = await supabase
        .from("tareas_empleados_designados")
        .select(
          `
          empleado:empleados(
            id,
            nombre,
            apellido
          )
        `
        )
        .eq("tarea_id", tareaId);

      // Cargar responsables
      const { data: responsables } = await supabase
        .from("tareas_empleados_responsables")
        .select(
          `
          empleado:empleados(
            id,
            nombre,
            apellido
          )
        `
        )
        .eq("tarea_id", tareaId);

      // Actualizar tarea con empleados completos
      if (tarea && (designados || responsables)) {
        const empleadosDesignados =
          designados?.map((d) => d.empleado).filter(Boolean) || [];
        const empleadosResponsables =
          responsables?.map((r) => r.empleado).filter(Boolean) || [];

        // Asegurarse de que los empleados tengan la estructura correcta
        const formatearEmpleados = (empleados) =>
          empleados.map((emp) => ({
            id: emp.id,
            nombre: emp.nombre || "Sin nombre",
            apellido: emp.apellido || "",
          }));

        // Actualizar directamente en la tarea
        tarea.empleados_designados = formatearEmpleados(empleadosDesignados);
        tarea.empleados_responsables = formatearEmpleados(
          empleadosResponsables
        );
      }
    } catch (error) {
      console.error("Error al cargar empleados de la tarea:", error);
    }
  };

  // Ya NO necesitamos suscripción en tiempo real en el panel
  // Los cambios se reflejan automáticamente porque `tarea` viene del padre
  // y el padre tiene su propia suscripción en TareasTable

  const cargarCatalogos = async () => {
    try {
      const [procesosRes, clientesRes, estadosRes, empleadosRes] =
        await Promise.all([
          supabase.from("procesos").select("id, nombre").order("nombre"),
          supabase.from("clientes").select("id, nombre").order("nombre"),
          supabase
            .from("estados_tarea")
            .select("id, nombre, color, categoria, orden")
            .eq("activo", true)
            .order("orden"),
          supabase
            .from("empleados")
            .select("id, nombre, apellido")
            .eq("activo", true)
            .order("nombre"),
        ]);

      if (procesosRes.data) setProcesos(procesosRes.data);
      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (empleadosRes.data) {
        setEmpleados(empleadosRes.data);
      } else {
        console.warn(
          "⚠️ No se pudieron cargar empleados - verificar política RLS"
        );
        // Cargar empleado actual como fallback
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: empleadoActual } = await supabase
            .from("empleados")
            .select("id, nombre, apellido")
            .eq("auth_user_id", userData.user.id)
            .single();
          if (empleadoActual) {
            setEmpleados([empleadoActual]);
          }
        }
      }
      setCatalogosCargados(true);
      setInitialLoading(false);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      setInitialLoading(false);
    }
  };

  // Función para verificar si una tarea debe sincronizarse con Google Calendar
  const debeSincronizarConCalendario = (nombreTarea) => {
    if (!nombreTarea) return false;
    const nombreUpper = nombreTarea.toUpperCase();
    return (
      nombreUpper.startsWith("VENCIMIENTO") ||
      nombreUpper.startsWith("SEGUIMIENTO") ||
      nombreUpper.startsWith("AUDIENCIA") ||
      nombreUpper.startsWith("REUNIÓN") ||
      nombreUpper.startsWith("REUNION")
    );
  };

  // Guardar título solo en blur o Enter
  const guardarTitulo = async () => {
    const nuevoTitulo = tituloLocal.trim();

    // Si no hay cambios, no hacer nada
    if (nuevoTitulo === valorAnteriorTitulo.current) {
      return;
    }

    // Validar que no esté vacío
    if (!nuevoTitulo) {
      toast.error("El título no puede estar vacío");
      setTituloLocal(valorAnteriorTitulo.current);
      return;
    }

    // Si es una tarea existente, actualizar en DB
    if (tarea?.id) {
      const { error } = await supabase
        .from("tareas")
        .update({ nombre: nuevoTitulo })
        .eq("id", tarea.id);

      if (error) {
        console.error("Error actualizando título:", error);
        toast.error("Error al guardar el título");
        setTituloLocal(valorAnteriorTitulo.current);
        return;
      }

      toast.success("Título actualizado");
      valorAnteriorTitulo.current = nuevoTitulo;
      onUpdate?.(); // Recargar datos
    } else {
      // Si es nueva, solo actualizar estado temporal
      setNuevaTareaTemp((prev) => ({
        ...prev,
        nombre: nuevoTitulo,
      }));
      valorAnteriorTitulo.current = nuevoTitulo;
    }
  };

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, es modo creación - actualizar nuevaTareaTemp
      if (!tarea?.id) {
        // Actualizar el campo y buscar el objeto completo si es una relación
        const updates = { [campo]: valor };

        if (campo === "proceso_id" && valor) {
          const proceso = procesos.find((p) => p.id === valor);
          if (proceso) updates.proceso = proceso;
        } else if (campo === "estado_id" && valor) {
          const estado = estados.find((e) => e.id === valor);
          if (estado) updates.estado = estado;
        } else if (campo === "empleados_designados") {
          // Convertir array de opciones a array de objetos empleado (solo IDs válidos)
          updates.empleados_designados = valor
            .filter((opt) => opt.value && opt.value !== null)
            .map((opt) => {
              const emp = empleados.find((e) => e.id === opt.value);
              return (
                emp || {
                  id: opt.value,
                  nombre: opt.label.split(" ")[0],
                  apellido: opt.label.split(" ").slice(1).join(" "),
                }
              );
            });
        } else if (campo === "empleados_responsables") {
          // Convertir array de opciones a array de objetos empleado (solo IDs válidos)
          updates.empleados_responsables = valor
            .filter((opt) => opt.value && opt.value !== null)
            .map((opt) => {
              const emp = empleados.find((e) => e.id === opt.value);
              return (
                emp || {
                  id: opt.value,
                  nombre: opt.label.split(" ")[0],
                  apellido: opt.label.split(" ").slice(1).join(" "),
                }
              );
            });
        }

        // Actualizar nuevaTareaTemp con los cambios
        setNuevaTareaTemp((prev) => ({
          ...prev,
          ...updates,
        }));
        return;
      }

      // Modo edición: manejar arrays de empleados
      if (
        campo === "empleados_designados" ||
        campo === "empleados_responsables"
      ) {
        // Filtrar empleados válidos (con ID no null/undefined)
        const empleadosValidos = valor.filter(
          (opt) => opt.value && opt.value !== null
        );
        const empleadosIds = empleadosValidos.map((opt) => opt.value);

        const empleadosActualizados = empleadosValidos.map((opt) => {
          const emp = empleados.find((e) => e.id === opt.value);
          return emp
            ? {
                ...emp,
                empleado_id: emp.id,
                empleado: emp,
              }
            : {
                id: opt.value,
                empleado_id: opt.value,
                nombre: opt.label.split(" ")[0],
                apellido: opt.label.split(" ").slice(1).join(" "),
                empleado: {
                  id: opt.value,
                  nombre: opt.label.split(" ")[0],
                  apellido: opt.label.split(" ").slice(1).join(" "),
                },
              };
        });

        // Actualizar estado local inmediatamente para UI
        setTareaLocal((prev) => ({
          ...(prev || tarea),
          [campo]: empleadosActualizados,
        }));

        const tablaNombre =
          campo === "empleados_designados"
            ? "tareas_empleados_designados"
            : "tareas_empleados_responsables";

        // Eliminar relaciones existentes
        await supabase.from(tablaNombre).delete().eq("tarea_id", tarea.id);

        // Insertar nuevas relaciones solo si hay IDs válidos
        if (empleadosIds.length > 0) {
          const relaciones = empleadosIds.map((empId) => ({
            tarea_id: tarea.id,
            empleado_id: empId,
          }));

          const { error } = await supabase.from(tablaNombre).insert(relaciones);

          if (error) throw error;
        }

        toast.success("Actualizado correctamente");
        return;
      }

      // Modo edición: verificar si es cambio de estado a "finalizado"
      let datosActualizacion = { [campo]: valor };
      let esCompletada = false;

      if (campo === "estado_id") {
        const estadoSeleccionado = estados.find((e) => e.id === valor);
        const estadoNombre = estadoSeleccionado?.nombre
          ?.toLowerCase()
          .replace(/_/g, " ");
        esCompletada =
          estadoNombre === "finalizado" || estadoNombre === "completada";
        if (esCompletada) {
          datosActualizacion.fecha_completada = new Date().toISOString();
        } else {
          datosActualizacion.fecha_completada = null;
        }
      }

      // Actualizar tarea existente en BD
      const { error } = await supabase
        .from("tareas")
        .update(datosActualizacion)
        .eq("id", tarea.id);

      if (error) throw error;

      toast.success("Actualizado correctamente");

      // Llamar onUpdate() para recargar la tabla (y este panel se actualizará automáticamente)
      onUpdate?.();

      // Si se marcó como finalizado, actualizar título en Google Calendar
      if (esCompletada && debeSincronizarConCalendario(tarea.nombre)) {
        const calendarioKey = `estado-${tarea.id}`;
        if (!calendarioEnProgreso.current.has(calendarioKey)) {
          calendarioEnProgreso.current.add(calendarioKey);

          try {
            const response = await fetch("/api/calendar/events/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: tarea.id,
                title: `${tarea.nombre}`,
                completed: true,
                responsable:
                  tarea.empleados_responsables
                    ?.map((e) => {
                      // Manejar ambos formatos: directo o anidado
                      const emp = e.empleado || e;
                      return emp.nombre || emp.nombre_completo || "";
                    })
                    .filter(Boolean)
                    .join(", ") || "",
                designado:
                  tarea.empleados_designados
                    ?.map((e) => {
                      // Manejar ambos formatos: directo o anidado
                      const emp = e.empleado || e;
                      return emp.nombre || emp.nombre_completo || "";
                    })
                    .filter(Boolean)
                    .join(", ") || "",
                cliente: tarea.cliente?.nombre || "",
              }),
            });

            if (response.ok) {
            }
          } catch (calError) {
            console.warn(
              "⚠️ Error actualizando estado en calendario:",
              calError
            );
          } finally {
            setTimeout(() => {
              calendarioEnProgreso.current.delete(calendarioKey);
            }, 1000);
          }
        }
      }

      // Si se actualizó la descripción o notas, actualizar en Google Calendar
      if (
        (campo === "descripcion" || campo === "notas") &&
        debeSincronizarConCalendario(tarea.nombre)
      ) {
        const calendarioKey = `desc-${tarea.id}`;
        if (!calendarioEnProgreso.current.has(calendarioKey)) {
          calendarioEnProgreso.current.add(calendarioKey);

          try {
            // Obtener la tarea actualizada de la base de datos
            const { data: tareaActualizada } = await supabase
              .from("tareas")
              .select(
                `
                *,
                cliente:clientes(id, nombre),
                empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
                empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
              `
              )
              .eq("id", tarea.id)
              .single();

            if (!tareaActualizada) {
              console.warn(
                "⚠️ No se encontró la tarea para actualizar calendario"
              );
              return;
            }

            const response = await fetch("/api/calendar/events/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: tarea.id,
                description: tareaActualizada.descripcion || "",
                notes: tareaActualizada.notas || "",
                responsable:
                  tareaActualizada.empleados_responsables
                    ?.map((e) => {
                      const emp = e.empleado || e;
                      return emp.nombre || emp.nombre_completo || "";
                    })
                    .filter(Boolean)
                    .join(", ") || "",
                designado:
                  tareaActualizada.empleados_designados
                    ?.map((e) => {
                      const emp = e.empleado || e;
                      return emp.nombre || emp.nombre_completo || "";
                    })
                    .filter(Boolean)
                    .join(", ") || "",
                cliente: tareaActualizada.cliente?.nombre || "",
              }),
            });

            if (response.ok) {
            }
          } catch (calError) {
            console.warn(
              "⚠️ Error actualizando descripción en calendario:",
              calError
            );
          } finally {
            setTimeout(() => {
              calendarioEnProgreso.current.delete(calendarioKey);
            }, 1000);
          }
        }
      }

      // Si se actualizó la fecha de vencimiento, actualizar evento en Google Calendar
      if (campo === "fecha_vencimiento" && valor) {
        // Solo sincronizar si la tarea empieza con palabras clave
        if (!debeSincronizarConCalendario(tarea.nombre)) {
        
        } else {
          const calendarioKey = `fecha-${tarea.id}`;
          if (!calendarioEnProgreso.current.has(calendarioKey)) {
            calendarioEnProgreso.current.add(calendarioKey);

            try {
              // Crear fecha según el tipo de evento
              const [year, month, day] = valor.split("-");

              let fechaVencimiento, fechaFin;

              if (esTodoElDia) {
                // Evento de todo el día: usar solo fecha (sin hora)
                fechaVencimiento = `${valor}`;
                fechaFin = `${valor}`;
              } else {
                // Evento con hora específica
                const [horaIni, minIni] = horaInicio.split(":");
                const [horaEnd, minEnd] = horaFin.split(":");

                fechaVencimiento = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day),
                  parseInt(horaIni),
                  parseInt(minIni),
                  0
                );
                fechaFin = new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day),
                  parseInt(horaEnd),
                  parseInt(minEnd),
                  0
                );
              }

              const response = await fetch("/api/calendar/events/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskId: tarea.id,
                  title: `${tarea.nombre}`,
                  description: tarea.descripcion || "Tarea pendiente",
                  start: esTodoElDia
                    ? fechaVencimiento
                    : fechaVencimiento.toISOString(),
                  end: esTodoElDia ? fechaFin : fechaFin.toISOString(),
                  allDay: esTodoElDia,
                  responsable:
                    tarea.empleados_responsables
                      ?.map((e) => {
                        const emp = e.empleado || e;
                        return emp.nombre || emp.nombre_completo || "";
                      })
                      .filter(Boolean)
                      .join(", ") || "",
                  designado:
                    tarea.empleados_designados
                      ?.map((e) => {
                        const emp = e.empleado || e;
                        return emp.nombre || emp.nombre_completo || "";
                      })
                      .filter(Boolean)
                      .join(", ") || "",
                  cliente: tarea.cliente?.nombre || "",
                }),
              });

              if (response.ok) {
              
              } else if (response.status === 404) {
               
                await fetch("/api/calendar/events/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `${tarea.nombre}`,
                    description: tarea.descripcion || "Tarea pendiente",
                    start: esTodoElDia
                      ? fechaVencimiento
                      : fechaVencimiento.toISOString(),
                    end: esTodoElDia ? fechaFin : fechaFin.toISOString(),
                    taskId: tarea.id,
                    allDay: esTodoElDia,
                    responsable:
                      tarea.empleados_responsables
                        ?.map((e) => {
                          const emp = e.empleado || e;
                          return emp.nombre || emp.nombre_completo || "";
                        })
                        .filter(Boolean)
                        .join(", ") || "",
                    designado:
                      tarea.empleados_designados
                        ?.map((e) => {
                          const emp = e.empleado || e;
                          return emp.nombre || emp.nombre_completo || "";
                        })
                        .filter(Boolean)
                        .join(", ") || "",
                    cliente: tarea.cliente?.nombre || "",
                  }),
                });
              } else {
                const errorData = await response.json();
                console.warn(
                  "⚠️ No se pudo actualizar evento en calendario:",
                  errorData
                );
              }
            } catch (calError) {
              console.warn(
                "⚠️ Error al actualizar evento en calendario:",
                calError
              );
            } finally {
              setTimeout(() => {
                calendarioEnProgreso.current.delete(calendarioKey);
              }, 1000);
            }
          }
        }
      }

      // NO llamar onUpdate() para evitar recargar toda la tabla
      // La suscripción en tiempo real se encargará de actualizar
    } catch (error) {
      console.error("Error actualizando:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const guardarNuevaTarea = async () => {
    // Prevenir doble guardado
    if (loading) {
    
      return;
    }

    try {
      setLoading(true);

      if (!nuevaTareaTemp?.nombre && !tituloLocal) {
        toast.error("Por favor completa al menos el título de la tarea");
        return;
      }

      // Obtener el usuario actual y su empleado asociado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let empleadoCreadorId = null;
      if (user?.id) {
        const { data: empleado } = await supabase
          .from("empleados")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        empleadoCreadorId = empleado?.id || null;
      }

      // Objeto para insertar en la base de datos (sin arrays de empleados)
      const nuevaTarea = {
        nombre: tituloLocal || nuevaTareaTemp.nombre,
        descripcion: nuevaTareaTemp.descripcion || "",
        notas: nuevaTareaTemp.notas || "",
        proceso_id: nuevaTareaTemp.proceso_id || null,
        cliente_id: nuevaTareaTemp.cliente_id || null,
        estado_id: nuevaTareaTemp.estado_id || null,
        importancia: nuevaTareaTemp.importancia || "no importante",
        urgencia: nuevaTareaTemp.urgencia || "no urgente",
        empleado_creador_id: empleadoCreadorId,
        fecha_vencimiento: nuevaTareaTemp.fecha_vencimiento || null,
      };

      // ✅ Guardar arrays de empleados para usar con Google Calendar (no van a la BD)
      const empleadosParaCalendar = {
        empleados_responsables: nuevaTareaTemp.empleados_responsables || [],
        empleados_designados: nuevaTareaTemp.empleados_designados || [],
      };

      const { data, error } = await supabase
        .from("tareas")
        .insert([nuevaTarea])
        .select()
        .single();

      if (error) throw error;

      // Insertar empleados designados
      if (nuevaTareaTemp.empleados_designados?.length > 0) {
        // Filtrar empleados con IDs válidos
        const designadosValidos = nuevaTareaTemp.empleados_designados.filter(
          (emp) => emp.id && emp.id !== null
        );

        if (designadosValidos.length > 0) {
          const designados = designadosValidos.map((emp) => ({
            tarea_id: data.id,
            empleado_id: emp.id,
          }));

          const { error: errorDesignados } = await supabase
            .from("tareas_empleados_designados")
            .insert(designados);

          if (errorDesignados) {
            console.warn("Error insertando designados:", errorDesignados);
          }
        }
      }

      // Insertar empleados responsables SOLO si el usuario seleccionó algunos
      // (el trigger ya agregó al creador automáticamente)
      if (nuevaTareaTemp.empleados_responsables?.length > 0) {
        // Verificar qué responsables ya existen
        const { data: responsablesExistentes } = await supabase
          .from("tareas_empleados_responsables")
          .select("empleado_id")
          .eq("tarea_id", data.id);

        const idsExistentes = new Set(
          responsablesExistentes?.map((r) => r.empleado_id) || []
        );

        // Solo insertar los que no existen y tienen ID válido
        const responsablesNuevos = nuevaTareaTemp.empleados_responsables
          .filter(
            (emp) => emp.id && emp.id !== null && !idsExistentes.has(emp.id)
          )
          .map((emp) => ({
            tarea_id: data.id,
            empleado_id: emp.id,
          }));

        if (responsablesNuevos.length > 0) {
          const { error: errorResponsables } = await supabase
            .from("tareas_empleados_responsables")
            .insert(responsablesNuevos);

          if (errorResponsables) {
            console.warn("Error insertando responsables:", errorResponsables);
          }
        }
      }

      // Crear evento en Google Calendar si hay fecha de vencimiento
      if (data && nuevaTarea.fecha_vencimiento) {
        // Solo sincronizar si la tarea empieza con palabras clave
        if (!debeSincronizarConCalendario(nuevaTarea.nombre)) {
        
          toast.success("Tarea creada exitosamente");
        } else {
          try {
            // Crear fecha según el tipo de evento
            const [year, month, day] = nuevaTarea.fecha_vencimiento.split("-");

            let fechaVencimiento, fechaFin;

            if (esTodoElDia) {
              // Evento de todo el día
              fechaVencimiento = nuevaTarea.fecha_vencimiento;
              fechaFin = nuevaTarea.fecha_vencimiento;
            } else {
              // Evento con hora específica
              const [horaIni, minIni] = horaInicio.split(":");
              const [horaEnd, minEnd] = horaFin.split(":");

              fechaVencimiento = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(horaIni),
                parseInt(minIni),
                0
              );
              fechaFin = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(horaEnd),
                parseInt(minEnd),
                0
              );
            }
            // Preparar datos para Google Calendar
         

            const responsableStr =
              empleadosParaCalendar.empleados_responsables
                ?.map((e) => {
                
                  return e.nombre || e.apellido || e.nombre_completo || "";
                })
                .filter(Boolean)
                .join(", ") || "";
            const designadoStr =
              empleadosParaCalendar.empleados_designados
                ?.map((e) => {
                 
                  return e.nombre || e.apellido || e.nombre_completo || "";
                })
                .filter(Boolean)
                .join(", ") || "";
            const clienteStr =
              clientes.find((c) => c.id === nuevaTarea.cliente_id)?.nombre ||
              "";

            const response = await fetch("/api/calendar/events/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `${nuevaTarea.nombre}`,
                description: nuevaTarea.descripcion || "Tarea pendiente",
                start: esTodoElDia
                  ? fechaVencimiento
                  : fechaVencimiento.toISOString(),
                end: esTodoElDia ? fechaFin : fechaFin.toISOString(),
                taskId: data.id,
                allDay: esTodoElDia,
                responsable: responsableStr,
                designado: designadoStr,
                cliente: clienteStr,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(
                "❌ Error al crear evento en calendario:",
                errorData
              );
              toast.error(
                `Tarea creada, pero no se pudo crear evento en calendario: ${
                  errorData.error || "Error desconocido"
                }`
              );
            } else {
            
              toast.success("Tarea y evento creados exitosamente");
            }
          } catch (calError) {
            console.error("❌ Error de red al crear evento:", calError);
            toast.warning(
              "Tarea creada, pero hubo un problema al crear el evento en el calendario"
            );
          }
        }
      } else {
        toast.success("Tarea creada exitosamente");
      }
      // NO llamar onUpdate() - la suscripción en tiempo real actualizará la tabla
      onClose();
    } catch (error) {
      console.error("Error creando tarea:", error);
      toast.error("Error al crear tarea: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    // Agregar hora para evitar problema de zona horaria
    const date = fecha.includes("T")
      ? new Date(fecha)
      : new Date(fecha + "T12:00:00");
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determinar qué datos mostrar: tarea local (actualizada optimísticamente) o nueva tarea temporal
  const datosActuales = tarea?.id ? tareaLocal || tarea : nuevaTareaTemp;

  // Verificar si la tarea está finalizada
  const tareaFinalizada =
    datosActuales?.estado?.nombre === "finalizado" ||
    estados.find((e) => e.id === datosActuales?.estado_id)?.nombre ===
      "finalizado";

  // No renderizar si el panel está cerrado O si no hay datos
  if (!isOpen || !datosActuales) return null;

  return (
    <>
      {/* Overlay con animación */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[10998] transition-opacity backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Panel con animación slide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[900px] bg-white shadow-2xl z-[10999] overflow-y-auto"
          >
            {/* Header minimalista */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-[10000]">
              <div className="flex-1 min-w-0 mr-4">
                <input
                  type="text"
                  value={tituloLocal}
                  onChange={(e) => setTituloLocal(e.target.value)}
                  onBlur={guardarTitulo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.target.blur(); // Esto dispara el guardarTitulo
                    }
                  }}
                  placeholder="Título de la tarea..."
                  className={clsx(
                    "text-xl font-semibold text-gray-900 bg-transparent outline-none w-full rounded px-2 transition-colors",
                    !tarea?.id
                      ? "border-b-2 border-primary-400 focus:border-primary-600"
                      : "border-b border-transparent hover:border-gray-300 focus:border-primary-400"
                  )}
                  autoFocus={!tarea?.id}
                />
              </div>
              <div className="flex items-center gap-2">
                {!tarea?.id && (
                  <button
                    onClick={guardarNuevaTarea}
                    disabled={loading}
                    className={clsx(
                      "px-4 py-1.5 text-white text-sm font-medium rounded transition-colors flex items-center gap-2",
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary-600 hover:bg-primary-700"
                    )}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Tarea"
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Overlay para tarea finalizada */}
            {tareaFinalizada && (
              <div className="absolute inset-0 bg-black/50 z-[11000] flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                    <svg
                      className="w-12 h-12 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Tarea Terminada
                  </h3>
                  <p className="text-gray-900">
                    Esta tarea ha sido completada y no puede ser editada
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Contenido del panel */}
            <div className="px-6 py-4 space-y-0">
              {/* Propiedades en formato Notion */}
              <PropertyRow
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Proceso"
              >
                <div className="flex-1">
                  <Select
                    value={
                      datosActuales?.proceso_id
                        ? {
                            value: datosActuales.proceso_id,
                            label: datosActuales?.proceso
                              ? datosActuales.proceso.nombre
                              : procesos.find(
                                  (p) => p.id === datosActuales.proceso_id
                                )?.nombre || "Proceso seleccionado",
                          }
                        : null
                    }
                    options={procesos.map((p) => ({
                      value: p.id,
                      label: p.nombre,
                    }))}
                    onChange={(option) =>
                      actualizarCampo("proceso_id", option?.value || null)
                    }
                    placeholder="Buscar proceso..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "No se encontraron procesos"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "32px",
                        fontSize: "14px",
                        borderColor: "#e5e7eb",
                        borderRadius: "12px",
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 11002,
                        borderRadius: "12px",
                      }),
                    }}
                  />
                </div>
              </PropertyRow>

              <PropertyRow
                icon={<User className="w-3.5 h-3.5" />}
                label="Cliente"
              >
                <div className="flex-1">
                  <Select
                    value={
                      datosActuales?.cliente_id
                        ? {
                            value: datosActuales.cliente_id,
                            label: datosActuales?.cliente
                              ? datosActuales.cliente.nombre
                              : clientes.find(
                                  (c) => c.id === datosActuales.cliente_id
                                )?.nombre || "Cliente seleccionado",
                          }
                        : null
                    }
                    options={clientes.map((c) => ({
                      value: c.id,
                      label: c.nombre,
                    }))}
                    onChange={(option) =>
                      actualizarCampo("cliente_id", option?.value || null)
                    }
                    placeholder={
                      datosActuales?.proceso_id
                        ? "El proceso ya tiene un cliente"
                        : "Buscar cliente..."
                    }
                    isClearable={!datosActuales?.proceso_id}
                    isSearchable
                    isDisabled={!!datosActuales?.proceso_id}
                    noOptionsMessage={() => "No se encontraron clientes"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "32px",
                        fontSize: "14px",
                        borderColor: "transparent",
                        borderRadius: "12px",
                        backgroundColor: datosActuales?.proceso_id
                          ? "#f9fafb"
                          : "white",
                        cursor: datosActuales?.proceso_id
                          ? "not-allowed"
                          : "pointer",
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 11002,
                        borderRadius: "12px",
                      }),
                    }}
                  />
                </div>
              </PropertyRow>

              <PropertyRow
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label="Estado"
              >
                <EstadoSelectGrouped
                  value={datosActuales?.estado_id}
                  estados={estados}
                  onUpdate={(id) => actualizarCampo("estado_id", id)}
                />
              </PropertyRow>

              <PropertyRow
                icon={<User className="w-3.5 h-3.5" />}
                label="Designados"
              >
                {initialLoading ? (
                  <div className="flex gap-1">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <EmpleadosBadgeSelector
                    value={datosActuales?.empleados_designados || []}
                    options={empleados}
                    onUpdate={(selected) =>
                      actualizarCampo("empleados_designados", selected)
                    }
                    placeholder="Seleccionar designados..."
                  />
                )}
              </PropertyRow>

              <PropertyRow
                icon={<User className="w-3.5 h-3.5" />}
                label="Responsables"
              >
                {initialLoading ? (
                  <div className="flex gap-1">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <EmpleadosBadgeSelector
                    value={datosActuales?.empleados_responsables || []}
                    options={empleados}
                    onUpdate={(selected) =>
                      actualizarCampo("empleados_responsables", selected)
                    }
                    placeholder="Seleccionar responsables..."
                  />
                )}
              </PropertyRow>

              <PropertyRow
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label="Importancia"
              >
                <BadgeSelector
                  value={datosActuales?.importancia || "no importante"}
                  options={[
                    {
                      id: "importante",
                      nombre: "Importante",
                      color: "#EF4444",
                    },
                    {
                      id: "no importante",
                      nombre: "No importante",
                      color: "#10B981",
                    },
                  ]}
                  onUpdate={(val) => actualizarCampo("importancia", val)}
                />
              </PropertyRow>

              <PropertyRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Urgencia"
              >
                <BadgeSelector
                  value={datosActuales?.urgencia || "no urgente"}
                  options={[
                    { id: "urgente", nombre: "Urgente", color: "#F59E0B" },
                    {
                      id: "no urgente",
                      nombre: "Normal",
                      color: "#3B82F6",
                    },
                  ]}
                  onUpdate={(val) => actualizarCampo("urgencia", val)}
                />
              </PropertyRow>

              <PropertyRow
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Vencimiento"
              >
                <div className="flex-1 space-y-2">
                  <EditableDate
                    value={datosActuales?.fecha_vencimiento || ""}
                    onUpdate={(val) =>
                      actualizarCampo("fecha_vencimiento", val)
                    }
                    compact
                  />

                  {/* Selector de tipo de evento - SIEMPRE mostrar si hay fecha Y si sincroniza */}
                  {datosActuales?.fecha_vencimiento && (
                    <div className="space-y-2">
                      {debeSincronizarConCalendario(datosActuales?.nombre) ? (
                        <div className="flex flex-col gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setEsTodoElDia(!esTodoElDia)}
                              className="flex items-center gap-2 text-xs text-gray-700 hover:text-primary-600 transition-colors"
                            >
                              <div
                                className={clsx(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                  esTodoElDia
                                    ? "bg-primary-600 border-primary-600"
                                    : "border-gray-300"
                                )}
                              >
                                {esTodoElDia && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span className="font-semibold">Todo el día</span>
                            </button>
                            <span className="text-[10px] text-blue-600 font-medium">
                              📅 Se sincronizará con Google Calendar
                            </span>
                          </div>

                          {!esTodoElDia && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 font-medium">
                                Horario:
                              </span>
                              <input
                                type="time"
                                value={horaInicio}
                                onChange={(e) => setHoraInicio(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                              />
                              <span className="text-xs text-gray-500 font-medium">
                                a
                              </span>
                              <input
                                type="time"
                                value={horaFin}
                                onChange={(e) => setHoraFin(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-500 italic">
                          💡 Para sincronizar con Google Calendar, el nombre
                          debe empezar con: VENCIMIENTO, AUDIENCIA, REUNIÓN o
                          SEGUIMIENTO
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PropertyRow>

              {datosActuales?.fecha_completada && (
                <PropertyRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Completada"
                >
                  <span className="text-sm text-gray-700">
                    {formatearFecha(datosActuales.fecha_completada)}
                  </span>
                </PropertyRow>
              )}

              {/* Divisor */}
              <div className="border-t my-4"></div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Descripción
                </label>
                <EditableText
                  value={datosActuales?.descripcion || ""}
                  onUpdate={(val) => actualizarCampo("descripcion", val)}
                  multiline
                  placeholder="Agregar descripción..."
                />
              </div>

              {/* Notas */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Notas
                </label>
                <EditableText
                  value={datosActuales?.notas || ""}
                  onUpdate={(val) => actualizarCampo("notas", val)}
                  multiline
                  placeholder="Agregar notas..."
                />
              </div>

              {/* Metadatos al final */}
              {tarea?.id && (
                <div className="mt-6 pt-4 border-t space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Creada</span>
                    <span>{formatearFecha(tarea.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actualizada</span>
                    <span>{formatearFecha(tarea.updated_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Componente para selector de estado agrupado por categorías
function EstadoSelectGrouped({ value, estados, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Obtener el estado actual
  const estadoActual = estados.find((e) => e.id === value);

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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (estadoId) => {
    onUpdate(estadoId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors text-xs font-medium"
        style={{
          backgroundColor: estadoActual ? `${estadoActual.color}20` : "#f3f4f6",
          color: estadoActual ? estadoActual.color : "#6B7280",
        }}
      >
        {estadoActual ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: estadoActual.color }}
            />
            <span className="capitalize">
              {estadoActual.nombre.replace(/_/g, " ")}
            </span>
          </>
        ) : (
          <span>Seleccionar</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-[11001] w-[140px] max-h-[400px] overflow-y-auto"
          >
            {categorias.map((categoria) => {
              const estadosCategoria = estadosAgrupados[categoria.key];
              if (!estadosCategoria || estadosCategoria.length === 0)
                return null;

              return (
                <div key={categoria.key} className="py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {categoria.label}
                  </div>
                  {estadosCategoria.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => handleSelect(estado.id)}
                      className={clsx(
                        "w-full px-2 py-1.5 text-left hover:bg-gray-50 transition-colors",
                        value === estado.id && "bg-blue-50"
                      )}
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${estado.color}20`,
                          color: estado.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: estado.color }}
                        />
                        <span className="capitalize text-[11px]">
                          {estado.nombre.replace(/_/g, " ")}
                        </span>
                      </span>
                      {value === estado.id && (
                        <span className="ml-1 text-blue-600 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para selector de badges (Importancia, Urgencia)
function BadgeSelector({ value, options, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const opcionActual = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionId) => {
    onUpdate(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors text-xs font-medium"
        style={{
          backgroundColor: opcionActual ? `${opcionActual.color}20` : "#f3f4f6",
          color: opcionActual ? opcionActual.color : "#6B7280",
        }}
      >
        {opcionActual ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: opcionActual.color }}
            />
            <span className="capitalize">{opcionActual.nombre}</span>
          </>
        ) : (
          <span>Seleccionar</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-[11001] w-[130px] py-1"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={clsx(
                  "w-full px-2 py-1.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2",
                  value === option.id && "bg-blue-50"
                )}
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${option.color}20`,
                    color: option.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="capitalize">{option.nombre}</span>
                </span>
                {value === option.id && (
                  <span className="ml-auto text-blue-600 text-sm">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente PropertyRow estilo Notion
function PropertyRow({ icon, label, children }) {
  return (
    <div className="flex items-center py-1 hover:bg-gray-50 group">
      <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs text-gray-600 font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// Componente de texto editable optimizado
function EditableText({ value, onUpdate, multiline = false, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const inputRef = useRef();
  const valorInicialRef = useRef("");

  // Solo actualizar cuando NO estamos editando
  useEffect(() => {
    if (!editing) {
      setCurrentValue(value || "");
    }
  }, [value, editing]);

  // Auto-focus cuando entra en modo edición
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing, multiline]);

  const handleStartEdit = useCallback(() => {
    valorInicialRef.current = currentValue || "";
    setEditing(true);
  }, [currentValue]);

  const handleSave = useCallback(() => {
    const valorActualLimpio = currentValue.trim();
    const valorInicialLimpio = valorInicialRef.current.trim();

    // Solo guardar si hay cambios reales
    if (valorActualLimpio !== valorInicialLimpio) {
      onUpdate(valorActualLimpio);
    }

    setEditing(false);
  }, [currentValue, onUpdate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        setCurrentValue(valorInicialRef.current);
        setEditing(false);
      }
    },
    [multiline, handleSave]
  );

  return (
    <div className="w-full">
      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border-2 border-primary-400 rounded outline-none bg-primary-50 min-h-[100px] resize-y"
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border-2 border-primary-400 rounded outline-none bg-primary-50"
            placeholder={placeholder}
          />
        )
      ) : (
        <div
          onClick={handleStartEdit}
          className={clsx(
            "w-full px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer transition-colors",
            multiline ? "min-h-[100px] whitespace-pre-wrap" : "",
            !currentValue && "text-gray-400"
          )}
        >
          {currentValue || placeholder || "Vacío"}
        </div>
      )}
    </div>
  );
}

// Componente de select editable compacto
function EditableSelect({
  value,
  options,
  onUpdate,
  badge = false,
  compact = false,
}) {
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

  const getImportanciaUrgenciaColor = (value) => {
    const colors = {
      importante: "#EF4444",
      "no importante": "#10B981",
      urgente: "#F59E0B",
      "no urgente": "#3B82F6",
    };
    return colors[value?.toLowerCase()] || "#6B7280";
  };

  const selectedOption = options.find(
    (opt) =>
      opt.nombre?.toLowerCase() === value?.toLowerCase() || opt.id === value
  );

  return (
    <div className="w-full">
      <div
        ref={setReferenceElement}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full px-2 py-1 text-sm rounded-lg cursor-pointer transition-all",
          isOpen ? "bg-primary-50 ring-2 ring-primary-400" : "hover:bg-gray-100"
        )}
      >
        {badge && value ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor:
                value === "importante" ||
                value === "no importante" ||
                value === "urgente" ||
                value === "no urgente"
                  ? `${getImportanciaUrgenciaColor(value)}20`
                  : selectedOption?.color
                  ? `${selectedOption.color}20`
                  : "#E5E7EB",
              color:
                value === "importante" ||
                value === "no importante" ||
                value === "urgente" ||
                value === "no urgente"
                  ? getImportanciaUrgenciaColor(value)
                  : selectedOption?.color || "#6B7280",
            }}
          >
            {value}
          </span>
        ) : (
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || "Seleccionar"}
          </span>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-[11001] bg-white border-2 border-primary-400 shadow-xl rounded-lg py-1 min-w-[160px] max-h-[300px] overflow-auto"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onUpdate(option.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                {badge && (option.color || option.id === value) ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor:
                        option.id === "importante" ||
                        option.id === "no importante" ||
                        option.id === "urgente" ||
                        option.id === "no urgente"
                          ? `${getImportanciaUrgenciaColor(option.id)}20`
                          : `${option.color}20`,
                      color:
                        option.id === "importante" ||
                        option.id === "no importante" ||
                        option.id === "urgente" ||
                        option.id === "no urgente"
                          ? getImportanciaUrgenciaColor(option.id)
                          : option.color,
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
    </div>
  );
}

// Componente de fecha editable compacto
function EditableDate({ value, onUpdate, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    // Agregar hora para evitar problema de zona horaria
    const date = new Date(fecha + "T12:00:00");
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
      onUpdate(currentValue);
    }
  };

  return (
    <div className="w-full">
      {editing ? (
        <input
          type="date"
          value={currentValue ? currentValue.split("T")[0] : ""}
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
          className="w-40 px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 outline-none"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="w-full px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value ? formatearFecha(value) : "Sin fecha"}
          </span>
        </div>
      )}
    </div>
  );
}

// Componente de fecha con hora editable
function EditableDateWithTime({ value, onUpdate, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentDate(date.toISOString().split("T")[0]);
      setCurrentTime(
        date.toTimeString().split(" ")[0].substring(0, 5) || "00:00"
      );
    } else {
      setCurrentDate("");
      setCurrentTime("00:00");
    }
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = () => {
    setEditing(false);
    if (currentDate) {
      const fechaCompleta = `${currentDate}T${currentTime}:00`;
      if (fechaCompleta !== value) {
        onUpdate(fechaCompleta);
      }
    }
  };

  return (
    <div className="w-full">
      {editing ? (
        <div className="flex gap-2">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            onBlur={handleSave}
            className="w-40 px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 outline-none"
          />
          <input
            type="time"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            onBlur={handleSave}
            className="w-24 px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 outline-none"
          />
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="w-full px-2 py-1 text-sm rounded hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value ? formatearFecha(value) : "Sin fecha"}
          </span>
        </div>
      )}
    </div>
  );
}

// Componente para seleccionar empleados con badges de colores
function EmpleadosBadgeSelector({ value, options, onUpdate, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const updateInProgress = useRef(false);

  // Función para generar un color único basado en el ID del empleado
  const getEmpleadoColor = (empleadoId, nombreEmpleado = "") => {
    const colores = [
      { bg: "#DBEAFE", text: "#2563EB" }, // Azul
      { bg: "#D1FAE5", text: "#059669" }, // Verde
      { bg: "#FEF3C7", text: "#D97706" }, // Naranja
      { bg: "#EDE9FE", text: "#7C3AED" }, // Púrpura
      { bg: "#FCE7F3", text: "#DB2777" }, // Rosa
      { bg: "#BAE6FD", text: "#0284C7" }, // Azul claro
      { bg: "#FED7AA", text: "#EA580C" }, // Naranja claro
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

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggleEmpleado = (empleado) => {
    // Prevenir múltiples llamadas simultáneas
    if (updateInProgress.current) {
     
      return;
    }

    // Validar que el empleado tenga un ID válido
    if (!empleado.id) {
      console.error("❌ Empleado sin ID válido:", empleado);
      return;
    }

    updateInProgress.current = true;

    const isSelected = value?.some((e) => {
      const empId = e.empleado?.id || e.id;
      return empId === empleado.id;
    });

    let newValue;

    if (isSelected) {
      // Remover empleado
      newValue = value.filter((e) => {
        const empId = e.empleado?.id || e.id;
        return empId !== empleado.id;
      });
    } else {
      // Agregar empleado - mantener estructura original
      newValue = [...(value || []), { empleado: empleado }];
    }

    // Convertir a formato que espera el actualizarCampo
    const formatted = newValue
      .map((emp) => {
        const empData = emp.empleado || emp;
        const empId = empData.id;
        const empNombre = empData.nombre;

        // Solo incluir si tiene ID válido
        if (!empId) {
          console.warn("⚠️ Empleado sin ID, omitiendo:", empData);
          return null;
        }

        return {
          value: empId,
          label: empNombre || "Empleado",
        };
      })
      .filter(Boolean); // Eliminar nulls

    // Llamar a onUpdate - NO usar await para que sea inmediato
    onUpdate(formatted);

    // Liberar el lock después de un pequeño delay
    setTimeout(() => {
      updateInProgress.current = false;
    }, 300);
  };
  const handleRemoveEmpleado = (empleadoId, e) => {
    e.stopPropagation();
    const newValue = value.filter((emp) => {
      const empId = emp.empleado?.id || emp.id;
      return empId !== empleadoId;
    });
    const formatted = newValue
      .map((emp) => {
        const empData = emp.empleado || emp;
        const empId = empData.id;
        const empNombre = empData.nombre;

        if (!empId) return null;

        return {
          value: empId,
          label: empNombre || "Empleado",
        };
      })
      .filter(Boolean);

    onUpdate(formatted);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-wrap gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[32px]"
      >
        {value && value.length > 0 ? (
          value.map((emp, index) => {
            // Asegurar que tenemos el objeto empleado correcto
            const empleadoData = emp.empleado || emp;
            const empleadoId = empleadoData.id;
            const empleadoNombre =
              empleadoData.nombre || emp.nombre || "Sin nombre";

            const colorObj = getEmpleadoColor(empleadoId, empleadoNombre);
            const uniqueKey = empleadoId || `emp-${index}-${empleadoNombre}`;
            const primerNombre = empleadoNombre.split(" ")[0];


            return (
              <span
                key={uniqueKey}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium group"
                style={{
                  backgroundColor: colorObj.bg,
                  color: colorObj.text,
                }}
              >
                <span>{primerNombre}</span>
                <button
                  onClick={(e) => handleRemoveEmpleado(empleadoId, e)}
                  className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                  title="Eliminar"
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <span className="text-sm text-gray-400">{placeholder}</span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-[11001] min-w-[160px] max-h-[300px] overflow-y-auto py-1"
          >
            {options.map((empleado, index) => {
              const isSelected = value?.some((e) => {
                const empId = e.empleado?.id || e.id;
                return empId === empleado.id;
              });
              const colorObj = getEmpleadoColor(empleado.id, empleado.nombre);
              const uniqueKey =
                empleado.id || `option-${index}-${empleado.nombre}`;

              return (
                <button
                  key={uniqueKey}
                  onClick={() => handleToggleEmpleado(empleado)}
                  className={clsx(
                    "w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3",
                    isSelected && "bg-blue-50"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: colorObj.bg,
                      border: `2px solid ${colorObj.text}`,
                    }}
                  />
                  <span className="flex-1">
                    {empleado.nombre || "Empleado"}
                  </span>
                  {isSelected && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
