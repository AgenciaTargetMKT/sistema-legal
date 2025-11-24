// Test queries para verificar sintaxis

// Query 1 - Procesos (ORIGINAL con estado_general)
const query1 = {
  from: "procesos",
  select: "id, nombre, updated_at, clientes(nombre, apellido)",
  eq: { estado_general: "activo" },
  order: { updated_at: "asc" },
  limit: 5
};

// Query 2 - Tareas
const query2 = {
  from: "tareas", 
  select: "id, nombre, fecha_vencimiento, fecha_completada, procesos(id, nombre)",
  lt: { fecha_vencimiento: "2025-11-24" },
  is: { fecha_completada: null },
  order: { fecha_vencimiento: "asc" },
  limit: 5
};

// Query 3 - Impulsos
const query3 = {
  from: "impulsos",
  select: "id, titulo, descripcion, fecha_impulso, tipo, procesos(id, nombre)",
  gte: { fecha_impulso: "2025-11-24" },
  eq: { estado: "activo" },
  order: { fecha_impulso: "asc" },
  limit: 5
};

console.log("Queries definidas correctamente");
