"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import clsx from "clsx";

// ============================================
// COMPONENTE: EditableSelect
// Select con búsqueda y portal para z-index
// ============================================

export function EditableSelect({
  label,
  value,
  options = [],
  onUpdate,
  badge = false,
  badgeColor,
  placeholder = "Seleccionar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const inputRef = useRef(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    strategy: "fixed",
    modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
  });

  const opcionesFiltradas = options.filter((opt) =>
    opt.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onUpdate(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputClick = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popperElement &&
        !popperElement.contains(e.target) &&
        referenceElement &&
        !referenceElement.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, popperElement, referenceElement]);

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </span>
      <div ref={setReferenceElement} className="flex-1 ml-4">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value || ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={handleInputClick}
          onFocus={handleInputClick}
          placeholder={placeholder}
          className={clsx(
            "w-full px-3 py-2 rounded-lg text-sm transition-all outline-none",
            isOpen
              ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 border-transparent"
              : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600",
            badge && value && !isOpen && "font-medium"
          )}
          style={{
            backgroundColor:
              badge && value && !isOpen && badgeColor
                ? `${badgeColor}20`
                : undefined,
            color:
              badge && value && !isOpen && badgeColor ? badgeColor : undefined,
          }}
        />
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="z-[11000] bg-white dark:bg-gray-800 border-2 border-blue-400 shadow-xl rounded-lg overflow-hidden min-w-[280px]"
          >
            <div className="max-h-[300px] overflow-y-auto py-1">
              {opcionesFiltradas.length > 0 ? (
                opcionesFiltradas.map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm transition-colors text-gray-900 dark:text-gray-100"
                    onClick={() => handleSelect(option)}
                  >
                    {option.nombre}
                  </div>
                ))
              ) : (
                <div className="px-3 py-8 text-sm text-gray-400 text-center">
                  {searchTerm
                    ? `No se encontró "${searchTerm}"`
                    : "No hay opciones"}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
