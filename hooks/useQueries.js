import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ==================== TAREAS ====================
export function useTareas(options = {}) {
  return useQuery({
    queryKey: ["tareas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          empleado_creador_id,
          proceso:procesos(id, nombre),
          estado:estados_tarea(id, nombre, color, categoria),
          cliente:clientes(id, nombre),
          empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
          empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
        `
        )
        .order("orden", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("tareas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast.success("Tarea actualizada");
    },
    onError: (error) => {
      toast.error("Error al actualizar tarea: " + error.message);
    },
  });
}

export function useCreateTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tarea) => {
      const { data, error } = await supabase
        .from("tareas")
        .insert([tarea])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      toast.success("Tarea creada");
    },
    onError: (error) => {
      toast.error("Error al crear tarea: " + error.message);
    },
  });
}

// ==================== CLIENTES ====================
export function useClientes(options = {}) {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (cambian menos)
    ...options,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cliente) => {
      const { data, error } = await supabase
        .from("clientes")
        .insert([cliente])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente creado");
    },
    onError: (error) => {
      toast.error("Error al crear cliente: " + error.message);
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("clientes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar cliente: " + error.message);
    },
  });
}

// ==================== PROCESOS ====================
export function useProcesos(options = {}) {
  return useQuery({
    queryKey: ["procesos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procesos")
        .select(
          `
          *,
          cliente:clientes(nombre, documento_identidad),
          rol_cliente:rol_cliente_id(nombre),
          materia:materias(nombre),
          estado:estados_proceso(nombre, color),
          tipo_proceso:tipos_proceso(nombre),
          lugar_data:lugar(nombre),
          empleados_asignados:proceso_empleados(
            rol,
            empleado:empleados(nombre, apellido)
          )
        `
        )
        .order("orden", { ascending: true });

      if (error) {
        // Fallback si no existe columna orden
        if (error.code === "42703") {
          const { data: dataAlt, error: errorAlt } = await supabase
            .from("procesos")
            .select(
              `
              *,
              cliente:clientes(nombre, documento_identidad),
              rol_cliente:rol_cliente_id(nombre),
              materia:materias(nombre),
              estado:estados_proceso(nombre, color),
              tipo_proceso:tipos_proceso(nombre),
              lugar_data:lugar(nombre),
              empleados_asignados:proceso_empleados(
                rol,
                empleado:empleados(nombre, apellido)
              )
            `
            )
            .order("created_at", { ascending: true });

          if (errorAlt) throw errorAlt;
          return dataAlt || [];
        }
        throw error;
      }

      return data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    ...options,
  });
}

export function useUpdateProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("procesos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      toast.success("Proceso actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar proceso: " + error.message);
    },
  });
}

// ==================== EMPLEADOS ====================
export function useEmpleados(options = {}) {
  return useQuery({
    queryKey: ["empleados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empleados")
        .select("id, nombre, apellido")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (casi no cambian)
    ...options,
  });
}

// ==================== ESTADOS TAREA ====================
export function useEstadosTarea(options = {}) {
  return useQuery({
    queryKey: ["estados_tarea"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estados_tarea")
        .select("id, nombre, descripcion, color, categoria")
        .eq("activo", true)
        .order("orden");

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos (raramente cambian)
    ...options,
  });
}

// ==================== PREFETCH ====================
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    // Pre-cargar datos comunes
    queryClient.prefetchQuery({
      queryKey: ["empleados"],
      queryFn: async () => {
        const { data } = await supabase
          .from("empleados")
          .select("id, nombre, apellido")
          .eq("activo", true)
          .order("nombre");
        return data || [];
      },
    });

    queryClient.prefetchQuery({
      queryKey: ["estados_tarea"],
      queryFn: async () => {
        const { data } = await supabase
          .from("estados_tarea")
          .select("id, nombre, descripcion, color, categoria")
          .eq("activo", true)
          .order("orden");
        return data || [];
      },
    });
  };

  return { prefetchAll };
}
