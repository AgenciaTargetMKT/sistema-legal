import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - garbage collection (antes cacheTime)
      refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
      refetchOnMount: false, // No recargar si hay datos en caché
      refetchOnReconnect: false, // No recargar al reconectar
      retry: 1, // Solo 1 reintento
      retryDelay: 1000, // 1 segundo entre reintentos
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
