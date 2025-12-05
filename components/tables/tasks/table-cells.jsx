"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelRightOpen } from "lucide-react";
import clsx from "clsx";
import {
  formatearFechaCorta,
  getEmpleadoColor,
  getPrimerNombre,
} from "../shared";

// ============================================
// COMPONENTE: SortableRow
// Fila de tabla con drag & drop
// ============================================

export function SortableRow({
  tarea,
  estados,
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
        "border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/30 dark:hover:bg-gray-800/50 group transition-colors",
        estaFinalizada && "bg-green-50/50 dark:bg-green-900/20 opacity-70"
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
              ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
              : "cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-primary-600 dark:text-primary-400 rounded-md transition-all opacity-0 group-hover:opacity-100"
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
      {/* Responsable */}
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
      {/* Personas Asignadas (Designados) */}
      <EmpleadosDisplay
        empleados={tarea.empleados_designados || []}
        onTareaClick={() => onTareaClick?.(tarea)}
        disabled={estaFinalizada}
      />
    </tr>
  );
}

// ============================================
// COMPONENTE: TextCell
// Celda de texto editable
// ============================================

export function TextCell({
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
            className="flex-1 px-2 py-0.5 text-xs border-2 border-primary-400 rounded bg-primary-50 dark:bg-primary-900/20 outline-none text-gray-900 dark:text-gray-100"
          />
        ) : (
          <div
            onClick={() => !disabled && setEditing(true)}
            className={clsx(
              "flex-1 px-2 py-0.5 text-xs rounded transition-colors min-h-6 flex items-center",
              disabled
                ? "cursor-not-allowed text-gray-500 dark:text-gray-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-text",
              bold && "font-semibold text-gray-900 dark:text-gray-100"
            )}
          >
            {currentValue || (
              <span className="text-gray-400 dark:text-gray-500 font-normal">
                Vacío
              </span>
            )}
          </div>
        )}
        {iconButton}
      </div>
    </td>
  );
}

// ============================================
// COMPONENTE: EstadoCell
// Celda de estado con dropdown agrupado
// ============================================

export function EstadoCell({
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

  const estadoActual = estadoActualProp || estados.find((e) => e.id === value);

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
            className="z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 min-w-36 max-w-48 overflow-y-auto"
          >
            {categorias.map((categoria) => {
              const estadosCategoria = estadosAgrupados[categoria.key];
              if (estadosCategoria.length === 0) return null;

              return (
                <div key={categoria.key} className="mb-0.5 last:mb-0">
                  <div className="px-2 py-0.5 text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {categoria.label}
                  </div>
                  {estadosCategoria.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => {
                        onChange(estado.id);
                        setIsOpen(false);
                      }}
                      className="w-full px-2 py-0.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${estado.color}20`,
                          color: estado.color,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
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

// ============================================
// COMPONENTE: BadgeCell
// Celda con badge selector
// ============================================

export function BadgeCell({
  value,
  options,
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
          <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
            Seleccionar
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
            className="z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 min-w-[180px]"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

// ============================================
// COMPONENTE: DateCell
// Celda de fecha editable
// ============================================

export function DateCell({ value, onChange, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (currentValue !== value) {
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
          className="w-full px-2 py-0.5 text-xs border rounded bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400 outline-none text-gray-900 dark:text-gray-100"
        />
      ) : (
        <div
          onClick={() => !disabled && setEditing(true)}
          className={clsx(
            "min-h-6 px-2 py-0.5 rounded transition-all flex items-center text-xs",
            disabled
              ? "cursor-not-allowed text-gray-500 dark:text-gray-400"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          )}
        >
          {value ? (
            <span className="text-gray-900 dark:text-gray-100">
              {formatearFechaCorta(value)}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: "#FA7575FF" }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: "#FFFFFF" }}
              />
              Sin fecha
            </span>
          )}
        </div>
      )}
    </td>
  );
}

// ============================================
// COMPONENTE: EmpleadosDisplay
// Muestra empleados como badges coloridos
// ============================================

export function EmpleadosDisplay({ empleados, onTareaClick, disabled }) {
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
            const nombre = getPrimerNombre(empleado);
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
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Sin responsables
          </span>
        )}

        <button
          onClick={() => onTareaClick?.()}
          className="ml-1 text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Editar responsables"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </button>
      </div>
    </td>
  );
}
