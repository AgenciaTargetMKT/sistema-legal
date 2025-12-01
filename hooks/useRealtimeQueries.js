import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * 🔥 HOOK DE TAREAS CON REALTIME OPTIMIZADO
 * - Usa caché para cargas rápidas
 * - Actualiza en tiempo real solo lo necesario
 * - Invalidación selectiva (no recarga todo)
 */
export function useTareasRealtime(options = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  const query = useQuery({
    queryKey: ["tareas"],
    queryFn: async () => {
      console.log("🔄 Cargando tareas desde DB...");
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
      console.log(`✅ ${data?.length || 0} tareas cargadas`);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });

  // 🔥 Configurar Realtime
  useEffect(() => {
    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("tareas-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "tareas",
        },
        (payload) => {
          console.log("🔥 Realtime - Cambio en tareas:", payload.eventType);

          // Estrategia: Actualización optimista del caché
          queryClient.setQueryData(["tareas"], (oldData) => {
            if (!oldData) return oldData;

            switch (payload.eventType) {
              case "INSERT": {
                // Agregar nueva tarea al inicio
                console.log("➕ Nueva tarea añadida al caché");
                toast.success("Nueva tarea creada", { duration: 2000 });

                // Recargar para obtener relaciones completas
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ["tareas"] });
                }, 100);

                return oldData;
              }

              case "UPDATE": {
                // Actualizar tarea existente
                const updatedTarea = payload.new;
                console.log(`✏️ Tarea ${updatedTarea.id} actualizada en caché`);

                // Actualizar en el caché
                const newData = oldData.map((tarea) =>
                  tarea.id === updatedTarea.id
                    ? { ...tarea, ...updatedTarea }
                    : tarea
                );

                // Recargar después para obtener relaciones actualizadas
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ["tareas"] });
                }, 100);

                return newData;
              }

              case "DELETE": {
                // Eliminar tarea del caché
                const deletedId = payload.old.id;
                console.log(`🗑️ Tarea ${deletedId} eliminada del caché`);
                toast.info("Tarea eliminada", { duration: 2000 });

                return oldData.filter((tarea) => tarea.id !== deletedId);
              }

              default:
                return oldData;
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime conectado para tareas");
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Error en canal realtime");
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      
      }
    };
  }, [queryClient]);

  return query;
}

/**
 * 🔥 HOOK DE CLIENTES CON REALTIME OPTIMIZADO
 */
export function useClientesRealtime(options = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  const query = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      console.log("🔄 Cargando clientes desde DB...");
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log(`✅ ${data?.length || 0} clientes cargados`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("clientes-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clientes",
        },
        (payload) => {
          console.log("🔥 Realtime - Cambio en clientes:", payload.eventType);

          queryClient.setQueryData(["clientes"], (oldData) => {
            if (!oldData) return oldData;

            switch (payload.eventType) {
              case "INSERT":
                toast.success("Nuevo cliente creado", { duration: 2000 });
                return [payload.new, ...oldData];

              case "UPDATE":
                return oldData.map((cliente) =>
                  cliente.id === payload.new.id
                    ? { ...cliente, ...payload.new }
                    : cliente
                );

              case "DELETE":
                toast.info("Cliente eliminado", { duration: 2000 });
                return oldData.filter(
                  (cliente) => cliente.id !== payload.old.id
                );

              default:
                return oldData;
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime conectado para clientes");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);

  return query;
}

/**
 * 🔥 HOOK DE PROCESOS CON REALTIME OPTIMIZADO
 */
export function useProcesosRealtime(options = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  const query = useQuery({
    queryKey: ["procesos"],
    queryFn: async () => {
      console.log("🔄 Cargando procesos desde DB...");
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

      console.log(`✅ ${data?.length || 0} procesos cargados`);
      return data || [];
    },
    staleTime: 3 * 60 * 1000,
    ...options,
  });

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("procesos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "procesos",
        },
        (payload) => {
          console.log("🔥 Realtime - Cambio en procesos:", payload.eventType);

          // Para procesos, mejor invalidar y recargar por las relaciones complejas
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["procesos"] });
          }, 100);

          if (payload.eventType === "INSERT") {
            toast.success("Nuevo proceso creado", { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime conectado para procesos");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);

  return query;
}

/**
 * 🔥 HOOK PARA NOTAS/COMENTARIOS EN TIEMPO REAL
 * Útil para la funcionalidad tipo "notas colaborativas"
 */
export function useNotasRealtime(procesoId, options = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  const query = useQuery({
    queryKey: ["notas", procesoId],
    queryFn: async () => {
      if (!procesoId) return [];

      const { data, error } = await supabase
        .from("comentarios")
        .select(
          `
          *,
          empleado:empleados(nombre, apellido)
        `
        )
        .eq("proceso_id", procesoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!procesoId,
    staleTime: 30 * 1000, // 30 segundos (cambios muy frecuentes)
    ...options,
  });

  useEffect(() => {
    if (!procesoId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notas-${procesoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comentarios",
          filter: `proceso_id=eq.${procesoId}`,
        },
        (payload) => {
          console.log("📝 Realtime - Cambio en notas:", payload.eventType);

          queryClient.setQueryData(["notas", procesoId], (oldData) => {
            if (!oldData) return oldData;

            switch (payload.eventType) {
              case "INSERT":
                // Nueva nota - agregar al inicio
                return [payload.new, ...oldData];

              case "UPDATE":
                // Nota actualizada
                return oldData.map((nota) =>
                  nota.id === payload.new.id
                    ? { ...nota, ...payload.new }
                    : nota
                );

              case "DELETE":
                // Nota eliminada
                return oldData.filter((nota) => nota.id !== payload.old.id);

              default:
                return oldData;
            }
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [procesoId, queryClient]);

  return query;
}

/**
 * 🎯 Hook para datos estáticos (empleados, estados)
 * Estos NO necesitan realtime porque cambian raramente
 */
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
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
}

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
    staleTime: 15 * 60 * 1000, // 15 minutos
    ...options,
  });
}
