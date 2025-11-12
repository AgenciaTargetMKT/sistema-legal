"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarDatosEmpleado(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarDatosEmpleado(session.user.id);
      } else {
        setEmpleado(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarDatosEmpleado = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from("empleados")
        .select(
          `
          *,
          rol:roles_empleados(*)
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (error) throw error;
      setEmpleado(data);
    } catch (error) {
      console.error("Error al cargar datos del empleado:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = () => {
    return empleado?.rol?.nombre === "admin";
  };

  const tienePermiso = (permiso) => {
    if (!empleado?.rol?.permisos) return false;
    return empleado.rol.permisos[permiso] === true;
  };

  return {
    user,
    empleado,
    loading,
    signOut,
    isAdmin,
    tienePermiso,
  };
}
