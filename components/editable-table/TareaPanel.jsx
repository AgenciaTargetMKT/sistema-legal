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
  const [tareaLocal, setTareaLocal] = useState(
    tarea || {
      nombre: "",
      titulo: "",
      descripcion: "",
      observaciones: "",
      prioridad: "media",
      fecha_vencimiento: null,
      proceso_id: null,
      estado_id: null,
      empleado_asignado_id: null,
    }
  );

  // Estado local para el título (evita actualizar DB en cada tecla)
  const [tituloLocal, setTituloLocal] = useState("");
  const valorAnteriorTitulo = useRef("");

  // Ref para prevenir llamadas duplicadas al calendario
  const calendarioEnProgreso = useRef(new Set());

  // Catálogos
  const [procesos, setProcesos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    if (isOpen) {
      cargarCatalogos();
      setTareaLocal(
        tarea || {
          nombre: "",
          titulo: "",
          descripcion: "",
          observaciones: "",
          prioridad: "media",
          fecha_vencimiento: null,
          proceso_id: null,
          estado_id: null,
          empleado_asignado_id: null,
        }
      );
    }
  }, [isOpen, tarea]);

  // Actualizar tareaLocal cuando tarea cambia (incluso si el panel ya está abierto)
  useEffect(() => {
    if (tarea && isOpen) {
      console.log("🔄 Actualizando tareaLocal con:", {
        id: tarea.id,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        observaciones: tarea.observaciones,
      });
      setTareaLocal(tarea);
    }
  }, [tarea, isOpen]);

  // Suscripción en tiempo real para actualizar el panel cuando cambie la tarea
  useEffect(() => {
    if (!tarea?.id || !isOpen) return;

    const channel = supabase
      .channel(`tarea-${tarea.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tareas",
          filter: `id=eq.${tarea.id}`,
        },
        (payload) => {
          // Actualizar solo los campos que cambiaron
          setTareaLocal((prev) => ({ ...prev, ...payload.new }));

          // Actualizar título local si cambió
          if (payload.new.nombre !== undefined) {
            setTituloLocal(payload.new.nombre || "");
            valorAnteriorTitulo.current = payload.new.nombre || "";
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tarea?.id, isOpen]);

  // Inicializar tituloLocal cuando cambia la tarea
  useEffect(() => {
    if (tarea) {
      const titulo = tarea.nombre || tarea.titulo || "";
      setTituloLocal(titulo);
      valorAnteriorTitulo.current = titulo;
    } else {
      setTituloLocal("");
      valorAnteriorTitulo.current = "";
    }
  }, [tarea]);

  const cargarCatalogos = async () => {
    try {
      const [procesosRes, estadosRes, empleadosRes] = await Promise.all([
        supabase.from("procesos").select("id, nombre").order("nombre"),
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
      setTareaLocal((prev) => ({ ...prev, nombre: nuevoTitulo }));
    } else {
      // Si es nueva, solo actualizar estado local
      setTareaLocal((prev) => ({
        ...prev,
        nombre: nuevoTitulo,
        titulo: nuevoTitulo,
      }));
      valorAnteriorTitulo.current = nuevoTitulo;
    }
  };

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, es modo creación - actualizar localmente
      if (!tarea?.id) {
        // Actualizar el campo y buscar el objeto completo si es una relación
        const updates = { [campo]: valor };

        if (campo === "proceso_id" && valor) {
          const proceso = procesos.find((p) => p.id === valor);
          if (proceso) updates.proceso = proceso;
        } else if (campo === "estado_id" && valor) {
          const estado = estados.find((e) => e.id === valor);
          if (estado) updates.estado = estado;
        } else if (campo === "empleado_asignado_id" && valor) {
          const empleado = empleados.find((e) => e.id === valor);
          if (empleado) updates.empleado_asignado = empleado;
        }

        setTareaLocal((prev) => ({ ...prev, ...updates }));
        return;
      }

      // Modo edición: verificar si es cambio de estado a "completada"
      let datosActualizacion = { [campo]: valor };
      let esCompletada = false;

      if (campo === "estado_id") {
        const estadoSeleccionado = estados.find((e) => e.id === valor);
        esCompletada =
          estadoSeleccionado?.nombre?.toLowerCase() === "completada";
        if (esCompletada) {
          datosActualizacion.fecha_completada = new Date().toISOString();
        } else {
          datosActualizacion.fecha_completada = null;
        }
      }

      // Actualizar tarea existente
      const { error } = await supabase
        .from("tareas")
        .update(datosActualizacion)
        .eq("id", tarea.id);

      if (error) throw error;

      // Actualizar estado local para reflejar cambios inmediatamente
      setTareaLocal((prev) => ({ ...prev, ...datosActualizacion }));

      toast.success("Actualizado correctamente");

      // Si se marcó como completada, actualizar título en Google Calendar
      if (esCompletada) {
        const calendarioKey = `estado-${tarea.id}`;
        if (!calendarioEnProgreso.current.has(calendarioKey)) {
          calendarioEnProgreso.current.add(calendarioKey);

          try {
            const response = await fetch("/api/calendar/events/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: tarea.id,
                title: `✅ [TAREA TERMINADA] ${
                  tareaLocal.nombre || tarea.nombre
                }`,
                completed: true,
              }),
            });

            if (response.ok) {
              console.log(
                "✅ Evento marcado como completado en Google Calendar"
              );
            } else if (response.status === 404) {
              console.log(
                "⚠️ Evento no encontrado en calendario (ya fue eliminado o no existía)"
              );
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

      // Si se actualizó la fecha de vencimiento, actualizar evento en Google Calendar
      if (campo === "fecha_vencimiento" && valor) {
        const calendarioKey = `fecha-${tarea.id}`;
        if (!calendarioEnProgreso.current.has(calendarioKey)) {
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
                taskId: tarea.id,
                title: `[TAREA] ${tareaLocal.nombre || tarea.nombre}`,
                description:
                  tareaLocal.descripcion ||
                  tarea.descripcion ||
                  "Tarea pendiente",
                start: fechaVencimiento.toISOString(),
                end: fechaFin.toISOString(),
              }),
            });

            if (response.ok) {
              console.log("✅ Evento actualizado en Google Calendar");
            } else if (response.status === 404) {
              // Si no existe evento, crear uno nuevo
              console.log("📅 Evento no existe, creando nuevo...");
              await fetch("/api/calendar/events/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: `[TAREA] ${tareaLocal.nombre || tarea.nombre}`,
                  description:
                    tareaLocal.descripcion ||
                    tarea.descripcion ||
                    "Tarea pendiente",
                  start: fechaVencimiento.toISOString(),
                  end: fechaFin.toISOString(),
                  taskId: tarea.id,
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

      // NO llamar onUpdate() para evitar recargar toda la tabla
      // La suscripción en tiempo real se encargará de actualizar
    } catch (error) {
      console.error("Error actualizando:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const guardarNuevaTarea = async () => {
    try {
      if (!tareaLocal?.titulo && !tareaLocal?.nombre) {
        toast.error("Por favor completa al menos el título de la tarea");
        return;
      }

      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const nuevaTarea = {
        nombre: tareaLocal.titulo || tareaLocal.nombre,
        descripcion: tareaLocal.descripcion || "",
        proceso_id: tareaLocal.proceso_id || null,
        estado_id: tareaLocal.estado_id || null,
        prioridad: tareaLocal.prioridad || "media",
        empleado_asignado_id: tareaLocal.empleado_asignado_id || user?.id,
        fecha_limite: tareaLocal.fecha_limite || null,
        fecha_vencimiento: tareaLocal.fecha_vencimiento || null,
        observaciones: tareaLocal.observaciones || "",
      };

      const { data, error } = await supabase
        .from("tareas")
        .insert([nuevaTarea])
        .select()
        .single();

      if (error) throw error;

      // Crear evento en Google Calendar si hay fecha de vencimiento
      if (data && nuevaTarea.fecha_vencimiento) {
        try {
          // Crear fecha en hora local sin conversión de timezone
          const [year, month, day] = nuevaTarea.fecha_vencimiento.split("-");
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

          const response = await fetch("/api/calendar/events/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `[TAREA] ${nuevaTarea.nombre}`,
              description: nuevaTarea.descripcion || "Tarea pendiente",
              start: fechaVencimiento.toISOString(),
              end: fechaFin.toISOString(),
              taskId: data.id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Error al crear evento en calendario:", errorData);
            toast.error(
              `Tarea creada, pero no se pudo crear evento en calendario: ${
                errorData.error || "Error desconocido"
              }`
            );
          } else {
            console.log("✅ Evento creado en Google Calendar");
            toast.success("Tarea y evento creados exitosamente");
          }
        } catch (calError) {
          console.error("❌ Error de red al crear evento:", calError);
          toast.warning(
            "Tarea creada, pero hubo un problema al crear el evento en el calendario"
          );
        }
      } else {
        toast.success("Tarea creada exitosamente");
      }
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error creando tarea:", error);
      toast.error("Error al crear tarea: " + error.message);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !tarea) return null;

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
            className="fixed right-0 top-0 h-full w-[680px] bg-white shadow-2xl z-[10999] overflow-y-auto"
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
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Guardar Tarea
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

            {/* Contenido compacto */}
            <div className="px-6 py-4 space-y-0">
              {/* Propiedades en formato Notion */}
              <PropertyRow
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Proceso"
              >
                <div className="flex-1">
                  <Select
                    value={
                      tareaLocal?.proceso_id
                        ? {
                            value: tareaLocal.proceso_id,
                            label: tareaLocal?.proceso
                              ? tareaLocal.proceso.nombre
                              : procesos.find(
                                  (p) => p.id === tareaLocal.proceso_id
                                )
                              ? procesos.find(
                                  (p) => p.id === tareaLocal.proceso_id
                                ).nombre
                              : "Proceso seleccionado",
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
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 11002,
                      }),
                    }}
                  />
                </div>
              </PropertyRow>

              <PropertyRow
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label="Estado"
              >
                <EditableSelect
                  value={
                    tareaLocal?.estado?.nombre ||
                    estados.find((e) => e.id === tareaLocal?.estado_id)
                      ?.nombre ||
                    ""
                  }
                  options={estados}
                  onUpdate={(id) => actualizarCampo("estado_id", id)}
                  badge
                  compact
                />
              </PropertyRow>

              <PropertyRow
                icon={<User className="w-3.5 h-3.5" />}
                label="Asignado"
              >
                <EditableSelect
                  value={
                    tareaLocal?.empleado_asignado
                      ? `${tareaLocal.empleado_asignado.nombre} ${tareaLocal.empleado_asignado.apellido}`
                      : tareaLocal?.empleado_asignado_id
                      ? (() => {
                          const emp = empleados.find(
                            (e) => e.id === tareaLocal.empleado_asignado_id
                          );
                          return emp
                            ? `${emp.nombre} ${emp.apellido}`
                            : "Empleado seleccionado";
                        })()
                      : ""
                  }
                  options={empleados.map((e) => ({
                    id: e.id,
                    nombre: `${e.nombre} ${e.apellido}`,
                  }))}
                  onUpdate={(id) => actualizarCampo("empleado_asignado_id", id)}
                  compact
                />
              </PropertyRow>

              <PropertyRow
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label="Prioridad"
              >
                <EditableSelect
                  value={tareaLocal.prioridad}
                  options={[
                    { id: "alta", nombre: "Alta" },
                    { id: "media", nombre: "Media" },
                    { id: "baja", nombre: "Baja" },
                  ]}
                  onUpdate={(val) => actualizarCampo("prioridad", val)}
                  badge
                  compact
                />
              </PropertyRow>

              <PropertyRow
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Vencimiento"
              >
                <EditableDate
                  value={tareaLocal.fecha_vencimiento}
                  onUpdate={(val) => actualizarCampo("fecha_vencimiento", val)}
                  compact
                />
              </PropertyRow>

              {tareaLocal.fecha_completada && (
                <PropertyRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Completada"
                >
                  <span className="text-sm text-gray-700">
                    {formatearFecha(tarea.fecha_completada)}
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
                  value={tareaLocal.descripcion}
                  onUpdate={(val) => actualizarCampo("descripcion", val)}
                  multiline
                  placeholder="Agregar descripción..."
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-2 mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Observaciones
                </label>
                <EditableText
                  value={tareaLocal.observaciones}
                  onUpdate={(val) => actualizarCampo("observaciones", val)}
                  multiline
                  placeholder="Agregar observaciones..."
                />
              </div>

              {/* Metadatos al final */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Componente PropertyRow estilo Notion
function PropertyRow({ icon, label, children }) {
  return (
    <div className="flex items-center py-1.5 hover:bg-gray-50 group">
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

  const getPrioridadColor = (prioridad) => {
    const colors = {
      alta: "#EF4444",
      media: "#F59E0B",
      baja: "#10B981",
    };
    return colors[prioridad?.toLowerCase()] || "#6B7280";
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
                value === "alta" || value === "media" || value === "baja"
                  ? `${getPrioridadColor(value)}20`
                  : selectedOption?.color
                  ? `${selectedOption.color}20`
                  : "#E5E7EB",
              color:
                value === "alta" || value === "media" || value === "baja"
                  ? getPrioridadColor(value)
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
            className="z-[11001] bg-white border-2 border-primary-400 shadow-xl rounded-lg py-1 min-w-[200px] max-h-[300px] overflow-auto"
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
                        option.id === "alta" ||
                        option.id === "media" ||
                        option.id === "baja"
                          ? `${getPrioridadColor(option.id)}20`
                          : `${option.color}20`,
                      color:
                        option.id === "alta" ||
                        option.id === "media" ||
                        option.id === "baja"
                          ? getPrioridadColor(option.id)
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
    return new Date(fecha).toLocaleDateString("es-ES", {
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
          className="w-full px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 outline-none"
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
            className="flex-1 px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 outline-none"
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
