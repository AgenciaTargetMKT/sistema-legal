// Tables components - Main barrel export
// Nueva estructura organizada por dominio

// ============================================
// TASKS - Componentes de tareas
// ============================================
export {
  TaskPanel,
  TasksTable,
  SortableRow,
  useTasksTable,
  EstadoSelectGrouped,
  BadgeSelector,
  EmpleadosBadgeSelector,
  debeSincronizarConCalendario,
} from "./tasks";

// ============================================
// PROCESSES - Componentes de procesos
// ============================================
export { ProcessPanel, ProcessesTable } from "./processes";

// ============================================
// SHARED - Componentes compartidos
// ============================================
export {
  ColumnHeader,
  EditableText,
  EditableSelect,
  EditableDate,
  PropertyRow,
  getSelectStyles,
  formatearFecha,
  formatearFechaCorta,
  getEmpleadoColor,
} from "./shared";

// ============================================
// LEGACY EXPORTS - Para compatibilidad
// TODO: Migrar imports a nueva estructura
// ============================================
export { TaskPanel as TareaPanel } from "./tasks";
export { TasksTable as TareasTable } from "./tasks";
export { ProcessPanel as ProcesoPanel } from "./processes";
export { ProcessesTable as ProcesosTable } from "./processes";
