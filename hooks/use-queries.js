import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ==================== PREFETCH ====================
// Pre-cargar datos comunes al iniciar la app
export function usePrefetchData() {
  const queryClient = useQueryClient();

  const prefetchAll = () => {
    // Pre-cargar empleados
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

    // Pre-cargar estados de tarea
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
