"use client";

import { useState, useEffect, useRef } from "react";
import ContentEditable from "react-contenteditable";
import clsx from "clsx";

// ============================================
// UTILIDAD: Limpiar HTML
// ============================================

export function cleanHTMLValue(val) {
  if (!val) return "";
  if (typeof document === "undefined") return String(val);
  const temp = document.createElement("div");
  temp.innerHTML = val;
  return temp.textContent || temp.innerText || "";
}

// ============================================
// COMPONENTE: EditableText
// Usa ContentEditable para edición inline rica
// ============================================

export function EditableText({ label, value, onUpdate, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(cleanHTMLValue(value));
  const contentRef = useRef();

  useEffect(() => {
    setCurrentValue(cleanHTMLValue(value));
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    const cleanedValue = cleanHTMLValue(currentValue);
    if (cleanedValue !== cleanHTMLValue(value)) {
      onUpdate(cleanedValue);
    }
  };

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

      const el = contentRef.current;
      el.addEventListener("keydown", handleKeyDown);
      return () => el?.removeEventListener("keydown", handleKeyDown);
    }
  }, [editing, value, multiline]);

  return (
    <div
      className={clsx(
        "flex justify-between",
        multiline ? "flex-col gap-2" : "items-center"
      )}
    >
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      <div
        className={clsx(
          "px-3 py-2 rounded text-sm transition-all cursor-text flex-1",
          multiline ? "min-h-20" : "min-h-8",
          !multiline && "ml-4",
          editing
            ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400"
            : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
        )}
        onClick={() => !editing && setEditing(true)}
      >
        {editing ? (
          <ContentEditable
            innerRef={contentRef}
            html={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            className="outline-none w-full dark:text-gray-100"
            style={{ caretColor: "#2563eb" }}
          />
        ) : (
          <div className="text-gray-900 dark:text-gray-100">
            {currentValue || (
              <span className="text-gray-400 dark:text-gray-500">
                Click para editar...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
