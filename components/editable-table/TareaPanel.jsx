"use client";

import { useState, useEffect, useRef } from "react";
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
      prioridad: "media",
      fecha_vencimiento: null,
      proceso_id: null,
      estado_id: null,
      empleado_asignado_id: null,
    }
  );

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
          prioridad: "media",
          fecha_vencimiento: null,
          proceso_id: null,
          estado_id: null,
          empleado_asignado_id: null,
        }
      );
    }
  }, [isOpen, tarea]);

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
          console.log("Tarea actualizada en tiempo real:", payload);
          setTareaLocal((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tarea?.id, isOpen]);

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

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, es modo creación - actualizar localmente
      if (!tarea?.id) {
        console.log(
          "Modo creación - campo actualizado localmente:",
          campo,
          valor
        );

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

      // Actualizar tarea existente (modo edición)
      const { error } = await supabase
        .from("tareas")
        .update({ [campo]: valor })
        .eq("id", tarea.id);

      if (error) throw error;

      onUpdate?.();
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

      toast.success("Tarea creada exitosamente");
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
                {!tarea?.id ? (
                  <input
                    type="text"
                    value={tareaLocal?.titulo || tareaLocal?.nombre || ""}
                    onChange={(e) => actualizarCampo("titulo", e.target.value)}
                    placeholder="Título de la tarea..."
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-primary-400 outline-none w-full focus:border-primary-600 rounded-lg px-2"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {tareaLocal?.nombre ||
                      tareaLocal?.titulo ||
                      "Tarea sin título"}
                  </h2>
                )}
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
                label="Recordatorio"
              >
                <EditableDateWithTime
                  value={tareaLocal.fecha_limite}
                  onUpdate={(val) => actualizarCampo("fecha_limite", val)}
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

              {tarea.fecha_completada && (
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

// Componente de texto editable compacto
function EditableText({ value, onUpdate, multiline = false, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const contentRef = useRef();

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  useEffect(() => {
    if (editing && contentRef.current) {
      const range = document.createRange();
      const sel = window.getSelection();

      if (multiline) {
        contentRef.current.focus();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        contentRef.current.focus();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [editing, value, multiline]);

  const handleSave = () => {
    setEditing(false);
    if (currentValue.trim() !== value) {
      onUpdate(currentValue.trim());
    }
  };

  return (
    <div className="w-full">
      {editing ? (
        <ContentEditable
          innerRef={contentRef}
          html={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !multiline) {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              setCurrentValue(value || "");
              setEditing(false);
            }
          }}
          className={clsx(
            "w-full px-2 py-1 text-sm border-2 border-primary-400 rounded outline-none bg-primary-50",
            multiline ? "min-h-[100px]" : ""
          )}
          tagName={multiline ? "div" : "span"}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
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
