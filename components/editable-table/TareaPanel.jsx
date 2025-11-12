"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ContentEditable from "react-contenteditable";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { X, Calendar, User, FileText, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";

export default function TareaPanel({ tarea, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);

  // Catálogos
  const [procesos, setProcesos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    if (isOpen && tarea) {
      cargarCatalogos();
    }
  }, [isOpen, tarea]);

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

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, crear nueva tarea
      if (!tarea?.id) {
        // Obtener el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const nuevaTarea = {
          nombre: tarea.nombre || "Nueva tarea",
          descripcion: tarea.descripcion || "",
          proceso_id: tarea.proceso_id,
          estado_id: tarea.estado_id,
          prioridad: tarea.prioridad || "media",
          empleado_asignado_id: tarea.empleado_asignado_id || user?.id,
          fecha_limite: tarea.fecha_limite,
          fecha_vencimiento: tarea.fecha_vencimiento,
          fecha_completada: tarea.fecha_completada,
          tiempo_estimado: tarea.tiempo_estimado,
          tiempo_real: tarea.tiempo_real,
          observaciones: tarea.observaciones || "",
          [campo]: valor, // Actualizar el campo que se está editando
        };

        const { data, error } = await supabase
          .from("tareas")
          .insert([nuevaTarea])
          .select()
          .single();

        if (error) throw error;

        // Actualizar el tarea con el nuevo ID
        tarea.id = data.id;
        onUpdate?.();
        return;
      }

      // Actualizar tarea existente
      const { error } = await supabase
        .from("tareas")
        .update({ [campo]: valor })
        .eq("id", tarea.id);

      if (error) throw error;

      onUpdate?.();
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Error al actualizar: " + error.message);
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
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[9998] transition-opacity backdrop-blur-[2px]"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[1200px] bg-white shadow-2xl z-[9999] overflow-y-auto">
        {/* Header fijo */}
        <div className="sticky top-0 bg-white border-b px-8 py-5 flex items-center justify-between z-[10000]">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tarea.titulo || tarea.nombre}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tarea ID: {tarea.id?.substring(0, 8)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Información Principal */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Información Principal
                </h3>
                <div className="space-y-3">
                  <EditableText
                    label="Título"
                    value={tarea.titulo || tarea.nombre}
                    onUpdate={(val) =>
                      actualizarCampo(tarea.titulo ? "titulo" : "nombre", val)
                    }
                  />
                  <EditableText
                    label="Descripción"
                    value={tarea.descripcion}
                    onUpdate={(val) => actualizarCampo("descripcion", val)}
                    multiline
                  />
                  <EditableSelect
                    label="Proceso"
                    value={
                      tarea.proceso
                        ? `${tarea.proceso.numero_proceso} - ${tarea.proceso.nombre}`
                        : ""
                    }
                    options={procesos.map((p) => ({
                      id: p.id,
                      nombre: `${p.numero_proceso} - ${p.nombre}`,
                    }))}
                    onUpdate={(id) => actualizarCampo("proceso_id", id)}
                  />
                  <EditableSelect
                    label="Estado"
                    value={tarea.estado?.nombre}
                    options={estados}
                    onUpdate={(id) => actualizarCampo("estado_id", id)}
                    badge
                  />
                  <EditableSelect
                    label="Prioridad"
                    value={tarea.prioridad}
                    options={[
                      { id: "alta", nombre: "Alta" },
                      { id: "media", nombre: "Media" },
                      { id: "baja", nombre: "Baja" },
                    ]}
                    onUpdate={(val) => actualizarCampo("prioridad", val)}
                    badge
                  />
                </div>
              </section>

              {/* Asignación */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Asignación
                </h3>
                <div className="space-y-3">
                  <EditableSelect
                    label="Empleado Asignado"
                    value={
                      tarea.empleado_asignado
                        ? `${tarea.empleado_asignado.nombre} ${tarea.empleado_asignado.apellido}`
                        : ""
                    }
                    options={empleados.map((e) => ({
                      id: e.id,
                      nombre: `${e.nombre} ${e.apellido}`,
                    }))}
                    onUpdate={(id) =>
                      actualizarCampo("empleado_asignado_id", id)
                    }
                  />
                </div>
              </section>

              {/* Fechas */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fechas
                </h3>
                <div className="space-y-3">
                  <EditableDate
                    label="Fecha Límite"
                    value={tarea.fecha_limite}
                    onUpdate={(val) => actualizarCampo("fecha_limite", val)}
                  />
                  <EditableDate
                    label="Fecha Vencimiento"
                    value={tarea.fecha_vencimiento}
                    onUpdate={(val) =>
                      actualizarCampo("fecha_vencimiento", val)
                    }
                  />
                  <EditableDate
                    label="Fecha Completada"
                    value={tarea.fecha_completada}
                    onUpdate={(val) => actualizarCampo("fecha_completada", val)}
                  />
                  <InfoRow
                    label="Creada"
                    value={formatearFecha(tarea.created_at)}
                  />
                  <InfoRow
                    label="Última actualización"
                    value={formatearFecha(tarea.updated_at)}
                  />
                </div>
              </section>

              {/* Tiempo */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Gestión de Tiempo
                </h3>
                <div className="space-y-3">
                  <EditableNumber
                    label="Tiempo Estimado (horas)"
                    value={tarea.tiempo_estimado}
                    onUpdate={(val) => actualizarCampo("tiempo_estimado", val)}
                  />
                  <EditableNumber
                    label="Tiempo Real (horas)"
                    value={tarea.tiempo_real}
                    onUpdate={(val) => actualizarCampo("tiempo_real", val)}
                  />
                </div>
              </section>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Observaciones */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Observaciones
                </h3>
                <EditableText
                  label="Observaciones"
                  value={tarea.observaciones}
                  onUpdate={(val) => actualizarCampo("observaciones", val)}
                  multiline
                />
              </section>

              {/* Información Adicional */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Información del Sistema
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-gray-900">
                      {tarea.id?.substring(0, 13)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tarea.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tarea.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orden:</span>
                    <span className="text-gray-900">{tarea.orden}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Componente InfoRow (solo lectura)
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

// Componente de texto editable
function EditableText({ label, value, onUpdate, multiline = false }) {
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
        if (e.key === "Enter" && !e.shiftKey && !multiline) {
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
  }, [editing, value, multiline]);

  const handleSave = () => {
    setEditing(false);
    if (currentValue.trim() !== value) {
      onUpdate(currentValue.trim());
    }
  };

  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600 pt-1">{label}</span>
      <div className="flex-1 max-w-md ml-4">
        {editing ? (
          <ContentEditable
            innerRef={contentRef}
            html={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            className={clsx(
              "w-full px-3 py-2 text-sm border rounded-lg outline-none bg-blue-50 ring-2 ring-blue-400",
              multiline ? "min-h-[100px]" : ""
            )}
            tagName={multiline ? "div" : "span"}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className={clsx(
              "w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer transition-colors",
              multiline ? "min-h-[100px] whitespace-pre-wrap" : ""
            )}
          >
            {currentValue || (
              <span className="text-gray-400">Click para editar</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de número editable
function EditableNumber({ label, value, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    const numValue = parseInt(currentValue) || null;
    if (numValue !== value) {
      onUpdate(numValue);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex-1 max-w-[150px] ml-4">
        {editing ? (
          <input
            type="number"
            value={currentValue}
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
            className="w-full px-3 py-2 text-sm border rounded-lg bg-blue-50 ring-2 ring-blue-400 outline-none"
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer transition-colors text-right"
          >
            {currentValue || <span className="text-gray-400">-</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de select editable
function EditableSelect({ label, value, options, onUpdate, badge = false }) {
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
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex-1 max-w-md ml-4">
        <div
          ref={setReferenceElement}
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-full px-3 py-2 text-sm rounded-lg cursor-pointer transition-all",
            isOpen ? "bg-blue-50 ring-2 ring-blue-400" : "hover:bg-gray-100"
          )}
        >
          {badge && value ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor:
                  label === "Prioridad"
                    ? `${getPrioridadColor(value)}20`
                    : selectedOption?.color
                    ? `${selectedOption.color}20`
                    : "#E5E7EB",
                color:
                  label === "Prioridad"
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
              className="z-[10001] bg-white border-2 border-blue-400 shadow-xl rounded-lg py-1 min-w-[250px] max-h-[300px] overflow-auto"
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onUpdate(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  {badge && (option.color || label === "Prioridad") ? (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          label === "Prioridad"
                            ? `${getPrioridadColor(option.id)}20`
                            : `${option.color}20`,
                        color:
                          label === "Prioridad"
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
    </div>
  );
}

// Componente de fecha editable
function EditableDate({ label, value, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
      onUpdate(currentValue || null);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex-1 max-w-[200px] ml-4">
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
            className="w-full px-3 py-2 text-sm border rounded-lg bg-blue-50 ring-2 ring-blue-400 outline-none"
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer transition-colors text-right"
          >
            {value ? formatearFecha(value) : "-"}
          </div>
        )}
      </div>
    </div>
  );
}
