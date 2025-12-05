// Tasks table components
// Componentes para la gestión de tareas

// Componentes principales
export { default as TaskPanel } from "./task-panel";
export { default as TasksTable } from "./tasks-table";

// Componentes de tabla
export { SortableRow } from "./table-cells";
export { useTasksTable } from "./use-tasks-table";

// Selectores del panel
export {
  EstadoSelectGrouped,
  BadgeSelector,
  EmpleadosBadgeSelector,
} from "./panel-selectors";

// Campos del panel
export { PropertyRow } from "./panel-fields";

// Funciones de sincronización con calendario
export {
  debeSincronizarConCalendario,
  sincronizarTituloConCalendario,
  sincronizarEstadoConCalendario,
  sincronizarFechaConCalendario,
  sincronizarDescripcionConCalendario,
  crearEventoParaNuevaTarea,
} from "./calendar-sync";
