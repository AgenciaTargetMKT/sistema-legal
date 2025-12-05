/**
 * Estilos de react-select para dark mode
 * Extraídos de task-panel.jsx para eliminar duplicación
 */

/**
 * Genera los estilos de react-select según el tema
 * @param {boolean} isDark - Si el tema es oscuro
 * @param {boolean} isDisabled - Si el select está deshabilitado
 * @returns {object} Objeto de estilos para react-select
 */
export const getSelectStyles = (isDark, isDisabled = false) => ({
  control: (base) => ({
    ...base,
    minHeight: "32px",
    fontSize: "14px",
    borderColor: isDisabled ? "transparent" : isDark ? "#374151" : "#e5e7eb",
    borderRadius: "12px",
    backgroundColor: isDisabled
      ? isDark
        ? "#1f2937"
        : "#f9fafb"
      : isDark
      ? "#111827"
      : "white",
    cursor: isDisabled ? "not-allowed" : "pointer",
    color: isDark ? "#f3f4f6" : "#111827",
  }),
  singleValue: (base) => ({
    ...base,
    color: isDark ? "#f3f4f6" : "#111827",
  }),
  input: (base) => ({
    ...base,
    color: isDark ? "#f3f4f6" : "#111827",
  }),
  placeholder: (base) => ({
    ...base,
    color: isDark ? "#9ca3af" : "#6b7280",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 11002,
    borderRadius: "12px",
    backgroundColor: isDark ? "#1f2937" : "white",
    border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
  }),
  menuList: (base) => ({
    ...base,
    padding: "4px",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? isDark
        ? "#3b82f6"
        : "#dbeafe"
      : state.isFocused
      ? isDark
        ? "#374151"
        : "#f3f4f6"
      : "transparent",
    color: state.isSelected
      ? isDark
        ? "#ffffff"
        : "#1e3a8a"
      : isDark
      ? "#f3f4f6"
      : "#111827",
    cursor: "pointer",
    ":active": {
      backgroundColor: isDark ? "#3b82f6" : "#dbeafe",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    padding: 0,
    color: isDark ? "#f3f4f6" : "#111827",
  }),
});

/**
 * Estilos para multi-select (empleados)
 */
export const getMultiSelectStyles = (isDark) => ({
  ...getSelectStyles(isDark),
  multiValue: (base) => ({
    ...base,
    backgroundColor: isDark ? "#374151" : "#e5e7eb",
    borderRadius: "9999px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: isDark ? "#f3f4f6" : "#111827",
    fontSize: "12px",
    padding: "2px 6px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: isDark ? "#9ca3af" : "#6b7280",
    borderRadius: "0 9999px 9999px 0",
    ":hover": {
      backgroundColor: isDark ? "#4b5563" : "#d1d5db",
      color: isDark ? "#f3f4f6" : "#111827",
    },
  }),
});
