"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  AlignLeft,
  User,
  Tag,
  MessageSquare,
  Calendar,
} from "lucide-react";
import clsx from "clsx";

// Mapa de iconos por tipo de columna
const COLUMN_ICONS = {
  nombre: AlignLeft,
  cliente: User,
  estado: Tag,
  ultima_actualizacion: MessageSquare,
  fecha_actualizacion: Calendar,
};

export default function ColumnHeader({
  label,
  columnId,
  onSort,
  currentSort,
  canSort = true,
  icon,
}) {
  const [showMenu, setShowMenu] = useState(false);
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
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu, popperElement, referenceElement]);

  const handleSort = (direction) => {
    onSort?.(columnId, direction);
    setShowMenu(false);
  };

  const getSortIcon = () => {
    if (!currentSort || currentSort.column !== columnId) {
      return null;
    }
    return currentSort.direction === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  if (!canSort) {
    const IconComponent = icon || COLUMN_ICONS[columnId];
    return (
      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-100 border-b dark:border-gray-700 border-r dark:border-r-gray-700">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span>{label}</span>
        </div>
      </th>
    );
  }

  const IconComponent = icon || COLUMN_ICONS[columnId];

  return (
    <>
      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-100 border-b dark:border-gray-700 border-r dark:border-r-gray-700">
        <div
          ref={setReferenceElement}
          onClick={() => setShowMenu(!showMenu)}
          className={clsx(
            "flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors group",
            showMenu && "text-blue-600 dark:text-blue-400"
          )}
        >
          {IconComponent && <IconComponent className="w-4 h-4" />}
          <span>{label}</span>
          {getSortIcon()}
          <ChevronDown
            className={clsx(
              "w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity",
              showMenu && "opacity-100 rotate-180"
            )}
          />
        </div>
      </th>

      {showMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className=" bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-1 min-w-[200px]"
          >
            <button
              onClick={() => handleSort("asc")}
              className={clsx(
                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-300",
                currentSort?.column === columnId &&
                  currentSort?.direction === "asc" &&
                  "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              )}
            >
              <ArrowUp className="w-4 h-4" />
              <span>Ordenar ascendente</span>
              {currentSort?.column === columnId &&
                currentSort?.direction === "asc" && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
            </button>
            <button
              onClick={() => handleSort("desc")}
              className={clsx(
                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-gray-700 dark:text-gray-300",
                currentSort?.column === columnId &&
                  currentSort?.direction === "desc" &&
                  "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              )}
            >
              <ArrowDown className="w-4 h-4" />
              <span>Ordenar descendente</span>
              {currentSort?.column === columnId &&
                currentSort?.direction === "desc" && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button
              onClick={() => handleSort(null)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors text-gray-600 dark:text-gray-400"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Limpiar ordenamiento</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
