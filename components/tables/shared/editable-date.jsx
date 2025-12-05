"use client";

import { useState, useRef } from "react";

// ============================================
// COMPONENTE: EditableDate
// Selector de fecha/hora con datetime-local
// ============================================

export function EditableDate({ label, value, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef();

  const formatearFechaInput = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toISOString().slice(0, 16);
  };

  const formatearFechaDisplay = (fecha) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = (e) => {
    const newValue = e.target.value;
    setEditing(false);
    if (newValue && newValue !== formatearFechaInput(value)) {
      onUpdate(new Date(newValue).toISOString());
    }
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          type="datetime-local"
          defaultValue={formatearFechaInput(value)}
          onBlur={handleSave}
          onChange={handleSave}
          autoFocus
          className="px-3 py-2 rounded text-sm bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 outline-none flex-1 ml-4 dark:text-gray-100"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="px-3 py-2 rounded text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer transition-all flex-1 ml-4"
        >
          <span className="text-gray-900 dark:text-gray-100">
            {formatearFechaDisplay(value)}
          </span>
        </div>
      )}
    </div>
  );
}
