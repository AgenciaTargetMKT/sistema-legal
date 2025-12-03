import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export function useTareas(options = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  // Función para refetch que será estable
  const forceRefetch = useCallback(() => {
   
    queryClient.invalidateQueries({ queryKey: ["tareas"] });
    queryClient.refetchQueries({ queryKey: ["tareas"], type: "active" });
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["tareas"],
    queryFn: async () => {
      console.log("📊 Fetching tareas...");
      const { data, error } = await supabase
        .from("tareas")
        .select(
          `
          *,
          proceso:procesos(id, nombre),
          estado:estados_tarea(id, nombre, color, categoria),
          cliente:clientes(id, nombre),
          empleados_designados:tareas_empleados_designados(empleado:empleados(id, nombre, apellido)),
          empleados_responsables:tareas_empleados_responsables(empleado:empleados(id, nombre, apellido))
        `
        )
        .order("orden", { ascending: true });

      if (error) throw error;
      console.log("📊 Tareas fetched:", data?.length);
      return data || [];
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  });

  // 🔥 REALTIME: Escucha cambios en tablas
  useEffect(() => {
    // Evitar suscripciones duplicadas
    if (isSubscribedRef.current) {
      return;
    }

    // Limpiar canal previo si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Crear canal único con timestamp para evitar conflictos
    const channelName = `tareas-realtime-${Date.now()}`;
    console.log("🔌 Creando canal:", channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tareas" },
        (payload) => {
          console.log(
            `🔥 [TAREAS ${payload.eventType}]`,
            payload.new?.nombre || payload.old?.id
          );
          forceRefetch();

          if (payload.eventType === "INSERT") {
            toast.success("Nueva tarea creada", { duration: 2000, icon: "➕" });
          } else if (payload.eventType === "UPDATE") {
            toast("Tarea actualizada", { duration: 1500, icon: "✏️" });
          } else if (payload.eventType === "DELETE") {
            toast.error("Tarea eliminada", { duration: 2000, icon: "🗑️" });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tareas_empleados_designados" },
        () => {
        
          forceRefetch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_responsables",
        },
        () => {
        
          forceRefetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "estados_tarea" },
        () => {
        
          forceRefetch();
        }
      )
      .subscribe((status, err) => {

        if (status === "SUBSCRIBED") {
       
          isSubscribedRef.current = true;
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error en canal realtime:", err);
          isSubscribedRef.current = false;
        } else if (status === "CLOSED") {
        
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [forceRefetch]);

  return query;
}

/**
 * 🎯 EMPLEADOS (datos estáticos, caché largo)
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
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    ...options,
  });
}

/**
 * 🎯 ESTADOS DE TAREA (datos estáticos, caché largo)
 */
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
    gcTime: 60 * 60 * 1000, // 1 hora
    ...options,
  });
}

/**
 * 🔄 Prefetch para pre-cargar datos comunes
 */
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    // Pre-cargar empleados y estados al iniciar la app
    queryClient.prefetchQuery({
      queryKey: ["empleados"],
      queryFn: async () => {
        const { data } = await supabase
          .from("empleados")
          .select("id, nombre, apellido")
          .eq("activo", true);
        return data || [];
      },
    });

    queryClient.prefetchQuery({
      queryKey: ["estados_tarea"],
      queryFn: async () => {
        const { data } = await supabase
          .from("estados_tarea")
          .select("id, nombre, descripcion, color, categoria")
          .eq("activo", true);
        return data || [];
      },
    });
  };

  return { prefetchAll };
}
