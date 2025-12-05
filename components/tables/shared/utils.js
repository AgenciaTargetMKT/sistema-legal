/**
 * Utilidades compartidas para componentes de tablas editables
 */

/**
 * Formatea una fecha para mostrar en español
 * @param {string} fecha - Fecha en formato ISO o YYYY-MM-DD
 * @param {boolean} includeTime - Si incluir hora en el formato
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, includeTime = true) => {
  if (!fecha) return "-";
  // Agregar hora para evitar problema de zona horaria
  const date = fecha.includes("T")
    ? new Date(fecha)
    : new Date(fecha + "T12:00:00");

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleString("es-ES", options);
};

/**
 * Formatea una fecha corta (día, mes abreviado, año)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada corta
 */
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return "";
  const [year, month, day] = fecha.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Genera un color consistente para un empleado basado en su ID
 * @param {string} empleadoId - ID del empleado
 * @param {string} nombreEmpleado - Nombre del empleado (fallback)
 * @returns {{ bg: string, text: string }} Colores de fondo y texto
 */
export const getEmpleadoColor = (empleadoId, nombreEmpleado = "") => {
  const colores = [
    { bg: "#DBEAFE", text: "#2563EB" },
    { bg: "#D1FAE5", text: "#059669" },
    { bg: "#FEF3C7", text: "#D8A66CFF" },
    { bg: "#EDE9FE", text: "#7C3AED" },
    { bg: "#FCE7F3", text: "#DB2777" },
    { bg: "#BAE6FD", text: "#0284C7" },
    { bg: "#FED7AA", text: "#D78559FF" },
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

/**
 * Extrae el primer nombre de un empleado
 * @param {object} empleado - Objeto empleado
 * @returns {string} Primer nombre
 */
export const getPrimerNombre = (empleado) => {
  if (!empleado) return "Sin nombre";
  const nombre = empleado.nombre || empleado.nombre_completo || "";
  return nombre.split(" ")[0] || "Sin nombre";
};

/**
 * Formatea empleados para mostrar en badges
 * @param {Array} empleados - Array de empleados (puede ser anidado)
 * @returns {Array} Array de empleados formateados
 */
export const formatearEmpleadosParaBadges = (empleados) => {
  if (!Array.isArray(empleados)) return [];

  return empleados
    .filter((emp) => emp && (emp.empleado?.nombre || emp.nombre))
    .map((item) => {
      const empleado = item.empleado || item;
      return {
        id: empleado.id,
        nombre: empleado.nombre || "Sin nombre",
        apellido: empleado.apellido || "",
      };
    });
};

/**
 * Detecta el prefijo de sincronización de una tarea
 * @param {string} nombre - Nombre de la tarea
 * @returns {string} Prefijo detectado o cadena vacía
 */
export const detectarPrefijoTarea = (nombre) => {
  if (!nombre) return "";

  const prefijos = ["VENCIMIENTO", "AUDIENCIA", "REUNIÓN", "SEGUIMIENTO"];
  for (const prefijo of prefijos) {
    if (nombre.startsWith(`${prefijo}:`)) {
      return prefijo;
    }
  }
  return "";
};

/**
 * Remueve el prefijo de un título de tarea
 * @param {string} titulo - Título con posible prefijo
 * @returns {string} Título sin prefijo
 */
export const removerPrefijoTitulo = (titulo) => {
  if (!titulo) return "";
  return titulo
    .replace(/^(VENCIMIENTO|AUDIENCIA|REUNIÓN|SEGUIMIENTO):\s*/i, "")
    .trim();
};
