import { supabase } from "./supabase";

// Servicios para Empleados
export const empleadosService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .eq("activo", true)
      .order("nombre");

    if (error) throw error;
    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async crear(empleado) {
    const { data, error } = await supabase
      .from("empleados")
      .insert([empleado])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, empleado) {
    const { data, error } = await supabase
      .from("empleados")
      .update(empleado)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async eliminar(id) {
    const { error } = await supabase
      .from("empleados")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;
  },
};

// Servicios para Clientes
export const clientesService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("activo", true)
      .order("nombre");

    if (error) throw error;
    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async crear(cliente) {
    const { data, error } = await supabase
      .from("clientes")
      .insert([cliente])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, cliente) {
    const { data, error } = await supabase
      .from("clientes")
      .update(cliente)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async eliminar(id) {
    const { error } = await supabase
      .from("clientes")
      .update({ activo: false })
      .eq("id", id);

    if (error) throw error;
  },
};

// Servicios para Procesos
export const procesosService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from("procesos")
      .select(
        `
        *,
        clientes(id, nombre, apellido),
        empleados(id, nombre, apellido)
      `
      )
      .order("fecha_ultima_actualizacion", { ascending: false });

    if (error) throw error;
    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from("procesos")
      .select(
        `
        *,
        clientes(id, nombre, apellido, email, telefono),
        empleados(id, nombre, apellido, email),
        tareas(id, titulo, estado, fecha_vencimiento, prioridad),
        impulsos(id, titulo, fecha_impulso, tipo, estado),
        comentarios(id, contenido, tipo, created_at, empleados(nombre, apellido))
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async crear(proceso) {
    const { data, error } = await supabase
      .from("procesos")
      .insert([proceso])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, proceso) {
    const { data, error } = await supabase
      .from("procesos")
      .update(proceso)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerPorCliente(clienteId) {
    const { data, error } = await supabase
      .from("procesos")
      .select(
        `
        *,
        empleados(id, nombre, apellido)
      `
      )
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Servicios para Tareas
export const tareasService = {
  async obtenerTodas() {
    const { data, error } = await supabase
      .from("tareas")
      .select(
        `
        *,
        procesos(id, numero_proceso, titulo),
        empleados(id, nombre, apellido)
      `
      )
      .order("fecha_vencimiento", { ascending: true });

    if (error) throw error;
    return data;
  },

  async obtenerPorProceso(procesoId) {
    const { data, error } = await supabase
      .from("tareas")
      .select(
        `
        *,
        empleados(id, nombre, apellido)
      `
      )
      .eq("proceso_id", procesoId)
      .order("fecha_vencimiento", { ascending: true });

    if (error) throw error;
    return data;
  },

  async crear(tarea) {
    const { data, error } = await supabase
      .from("tareas")
      .insert([tarea])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, tarea) {
    const { data, error } = await supabase
      .from("tareas")
      .update(tarea)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completar(id) {
    const { data, error } = await supabase
      .from("tareas")
      .update({
        estado: "completada",
        completada_el: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Servicios para Impulsos
export const impulsosService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from("impulsos")
      .select(
        `
        *,
        procesos(id, numero_proceso, titulo),
        empleados(id, nombre, apellido)
      `
      )
      .order("fecha_impulso", { ascending: true });

    if (error) throw error;
    return data;
  },

  async obtenerPorProceso(procesoId) {
    const { data, error } = await supabase
      .from("impulsos")
      .select(
        `
        *,
        empleados(id, nombre, apellido)
      `
      )
      .eq("proceso_id", procesoId)
      .order("fecha_impulso", { ascending: true });

    if (error) throw error;
    return data;
  },

  async crear(impulso) {
    const { data, error } = await supabase
      .from("impulsos")
      .insert([impulso])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async actualizar(id, impulso) {
    const { data, error } = await supabase
      .from("impulsos")
      .update(impulso)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completar(id) {
    const { data, error } = await supabase
      .from("impulsos")
      .update({ estado: "completado" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Servicios para Comentarios
export const comentariosService = {
  async obtenerPorProceso(procesoId) {
    const { data, error } = await supabase
      .from("comentarios")
      .select(
        `
        *,
        empleados(id, nombre, apellido)
      `
      )
      .eq("proceso_id", procesoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async crear(comentario) {
    const { data, error } = await supabase
      .from("comentarios")
      .insert([comentario])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
