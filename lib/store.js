import { create } from "zustand";
import { supabase } from "./supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  empleado: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setEmpleado: (empleado) => set({ empleado }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    // Si ya se inicializó, no hacer nada
    if (get().initialized) {
      return;
    }

    try {
      set({ loading: true });

      // Obtener sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user });

        // Cargar datos del empleado
        const { data: empleadoData } = await supabase
          .from("empleados")
          .select("*, rol:roles_empleados(*)")
          .eq("auth_user_id", session.user.id)
          .single();

        if (empleadoData) {
          set({ empleado: empleadoData });
        }
      }

      set({ loading: false, initialized: true });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ loading: false, initialized: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, empleado: null, initialized: false });
  },
}));
