// Shared table components
// Componentes reutilizables para tablas

// Column header con sorting
export { default as ColumnHeader } from "./column-header";

// Componentes editables
export { EditableText, cleanHTMLValue } from "./editable-inputs";
export { EditableSelect } from "./editable-select";
export { EditableDate } from "./editable-date";

// Estilos para react-select
export { getSelectStyles, getMultiSelectStyles } from "./select-styles";

// Utilidades compartidas
export {
  formatearFecha,
  formatearFechaCorta,
  getEmpleadoColor,
  getPrimerNombre,
  formatearEmpleadosParaBadges,
  detectarPrefijoTarea,
  removerPrefijoTitulo,
} from "./utils";

// ============================================
// COMPONENTE: PropertyRow (estilo Notion)
// ============================================
export function PropertyRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 -mx-2 rounded-lg transition-colors">
      {Icon && <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
