import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * 🚀 HOOK OPTIMIZADO PARA TAREAS
 * - Caché inteligente (2 min staleTime)
 * - Realtime en tablas normales
 * - Invalidación automática del caché
 */
export function useTareas(options = {}) {
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
    staleTime: 2 * 60 * 1000, // 2 minutos - caché activo
    gcTime: 10 * 60 * 1000, // 10 minutos en memoria
    ...options,
  });

  // 🔥 REALTIME: Escucha cambios en tablas y actualiza caché
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("tareas-realtime")
      // Cambios en tabla tareas
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
        },
        (payload) => {
          console.log(`🔥 [${payload.eventType}] Tarea cambiada`);

          // Invalidar caché = React Query recarga automático
          queryClient.invalidateQueries({
            queryKey: ["tareas"],
            refetchType: "active", // Solo recarga si hay componentes viéndolo
          });

          // Notificaciones
          if (payload.eventType === "INSERT") {
            toast.success("Nueva tarea creada", { duration: 2000, icon: "➕" });
          } else if (payload.eventType === "UPDATE") {
            toast.info("Tarea actualizada", { duration: 1500, icon: "✏️" });
          } else if (payload.eventType === "DELETE") {
            toast.error("Tarea eliminada", { duration: 2000, icon: "🗑️" });
          }
        }
      )
      // Cambios en empleados designados
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_designados",
        },
        () => {
         
          queryClient.invalidateQueries({
            queryKey: ["tareas"],
            refetchType: "active",
          });
        }
      )
      // Cambios en empleados responsables
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas_empleados_responsables",
        },
        () => {
          console.log("🔥 Empleado responsable cambió");
          queryClient.invalidateQueries({
            queryKey: ["tareas"],
            refetchType: "active",
          });
        }
      )
      // Cambios en estados (afecta las tareas)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "estados_tarea",
        },
        () => {
          
          queryClient.invalidateQueries({
            queryKey: ["tareas"],
            refetchType: "active",
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
        
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error en canal realtime");
        }
      });

    channelRef.current = channel;

    // Cleanup al desmontar
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
       
      }
    };
  }, [queryClient]);

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
