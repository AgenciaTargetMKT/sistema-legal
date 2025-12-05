"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// ============================================
// COMPONENTE: EstadoSelectGrouped
// Selector de estado agrupado por categorías
// ============================================

export function EstadoSelectGrouped({ value, estados, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const estadoActual = estados.find((e) => e.id === value);

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
            className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-9980 w-[140px] max-h-[400px] overflow-y-auto"
          >
            {categorias.map((categoria) => {
              const estadosCategoria = estadosAgrupados[categoria.key];
              if (!estadosCategoria || estadosCategoria.length === 0)
                return null;

              return (
                <div key={categoria.key} className="py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {categoria.label}
                  </div>
                  {estadosCategoria.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => handleSelect(estado.id)}
                      className={clsx(
                        "w-full px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                        value === estado.id &&
                          "bg-primary-50 dark:bg-primary-900/30"
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
                          {estado.nombre.charAt(0).toUpperCase() +
                            estado.nombre.slice(1).replace(/_/g, " ")}
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

// ============================================
// COMPONENTE: BadgeSelector
// Selector de badges (Importancia, Urgencia)
// ============================================

export function BadgeSelector({ value, options, onUpdate }) {
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
            className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-9980 w-40 py-1"
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={clsx(
                  "w-full px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2",
                  value === option.id && "bg-primary-50 dark:bg-primary-900/30"
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

// ============================================
// COMPONENTE: EmpleadosBadgeSelector
// Selector de empleados con badges coloridos
// ============================================

export function EmpleadosBadgeSelector({
  value,
  options,
  onUpdate,
  placeholder,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const updateInProgress = useRef(false);

  const getEmpleadoColor = (empleadoId, nombreEmpleado = "") => {
    const colores = [
      { bg: "#DBEAFE", text: "#2563EB" },
      { bg: "#D1FAE5", text: "#059669" },
      { bg: "#FEF3C7", text: "#D97706" },
      { bg: "#EDE9FE", text: "#7C3AED" },
      { bg: "#FCE7F3", text: "#DB2777" },
      { bg: "#BAE6FD", text: "#0284C7" },
      { bg: "#FED7AA", text: "#EA580C" },
      { bg: "#A7F3D0", text: "#047857" },
      { bg: "#FEE2E2", text: "#DC2626" },
      { bg: "#C7D2FE", text: "#4338CA" },
    ];

    let hash = 0;
    const idStr = String(empleadoId || nombreEmpleado || "default");

    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

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

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleEmpleado = (e, empleado) => {
    e.stopPropagation();

    if (updateInProgress.current) return;
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
      newValue = value.filter((e) => {
        const empId = e.empleado?.id || e.id;
        return empId !== empleado.id;
      });
    } else {
      newValue = [...(value || []), { empleado: empleado }];
    }

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
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={clsx(
          "flex flex-wrap gap-1.5 px-2 py-1.5 rounded-lg transition-colors min-h-8",
          disabled
            ? "cursor-not-allowed opacity-60 bg-gray-100 dark:bg-gray-800"
            : "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        )}
      >
        {value && value.length > 0 ? (
          value.map((emp, index) => {
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
                {!disabled && (
                  <button
                    onClick={(e) => handleRemoveEmpleado(empleadoId, e)}
                    className="ml-1 hover:bg-black/20 dark:hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                    title="Eliminar"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {placeholder}
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-11001 min-w-40 max-h-[300px] overflow-y-auto py-1"
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
                  type="button"
                  onClick={(e) => handleToggleEmpleado(e, empleado)}
                  className={clsx(
                    "w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3",
                    isSelected && "bg-primary-50 dark:bg-primary-900/30"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: colorObj.bg,
                      border: `2px solid ${colorObj.text}`,
                    }}
                  />
                  <span className="flex-1 text-gray-900 dark:text-gray-100">
                    {empleado.nombre || "Empleado"}
                  </span>
                  {isSelected && (
                    <span className="text-blue-600 dark:text-blue-400 text-sm">
                      ✓
                    </span>
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
