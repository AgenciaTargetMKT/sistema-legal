"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import clsx from "clsx";

// ============================================
// COMPONENTE: PropertyRow
// Fila de propiedad estilo Notion
// ============================================

export function PropertyRow({ icon, label, children }) {
  return (
    <div className="flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-800 group">
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {label}
        </span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ============================================
// COMPONENTE: EditableText
// Texto editable optimizado
// ============================================

export function EditableText({
  value,
  onUpdate,
  multiline = false,
  placeholder,
}) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const inputRef = useRef();
  const valorInicialRef = useRef("");

  useEffect(() => {
    if (!editing) {
      setCurrentValue(value || "");
    }
  }, [value, editing]);

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
            className="w-full px-2 py-1 text-sm border-2 border-primary-400 rounded outline-none bg-primary-50 dark:bg-primary-900/20 text-gray-900 dark:text-gray-100 min-h-[100px] resize-y"
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
            className="w-full px-2 py-1 text-sm border-2 border-primary-400 rounded outline-none bg-primary-50 dark:bg-primary-900/20 text-gray-900 dark:text-gray-100"
            placeholder={placeholder}
          />
        )
      ) : (
        <div
          onClick={handleStartEdit}
          className={clsx(
            "w-full px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors",
            multiline ? "min-h-[100px] whitespace-pre-wrap" : "",
            !currentValue && "text-gray-400 dark:text-gray-500",
            currentValue && "text-gray-900 dark:text-gray-100"
          )}
        >
          {currentValue || placeholder || "Vacío"}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: EditableDate
// Fecha editable compacta
// ============================================

export function EditableDate({ value, onUpdate, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  useEffect(() => {
    setCurrentValue(value || "");
  }, [value]);

  const formatearFecha = (fecha) => {
    if (!fecha) return null;
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
          className="w-40 px-2 py-1 text-sm border-2 border-primary-400 rounded bg-primary-50 dark:bg-primary-900/20 text-gray-900 dark:text-gray-100 outline-none"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="w-full px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <span
            className={
              value
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            }
          >
            {value ? formatearFecha(value) : "Sin fecha"}
          </span>
        </div>
      )}
    </div>
  );
}
