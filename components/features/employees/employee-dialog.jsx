"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const SUPABASE_FUNCTIONS_URL =
  "https://maketrlnjyibknqhdsah.supabase.co/functions/v1";

export default function EmpleadoDialog({
  open,
  onOpenChange,
  empleado,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    cargo: "",
    especialidad: "",
    fecha_ingreso: "",
    rol_id: "",
    activo: true,
  });

  useEffect(() => {
    if (open) {
      cargarRoles();
    }
  }, [open]);

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || "",
        apellido: empleado.apellido || "",
        email: empleado.email || "",
        telefono: empleado.telefono || "",
        cargo: empleado.cargo || "",
        especialidad: empleado.especialidad || "",
        fecha_ingreso: empleado.fecha_ingreso || "",
        rol_id: empleado.rol_id || "",
        activo: empleado.activo !== undefined ? empleado.activo : true,
      });
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        cargo: "",
        especialidad: "",
        fecha_ingreso: "",
        rol_id: "",
        activo: true,
      });
    }
  }, [empleado, open]);

  const cargarRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles_empleados")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error al cargar roles:", error);
    }
  };

  // Función para crear usuario en Auth via Edge Function
  const crearUsuarioAuth = async (email, telefono, nombre, apellido) => {
    try {
      // Obtener el token de sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const password = telefono
        ? telefono.replace(/\D/g, "").substring(0, 6)
        : "123456";

      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/create-empleado-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email,
            password,
            nombre,
            apellido,
            action: "create",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.user.id;
    } catch (error) {
      console.error("Error al crear usuario auth:", error);
      throw error;
    }
  };

  // Función para eliminar usuario Auth
  const eliminarUsuarioAuth = async (authUserId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/create-empleado-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: authUserId,
            action: "delete",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return true;
    } catch (error) {
      console.error("Error al eliminar usuario auth:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (empleado) {
        // CASO 2: Actualizar empleado existente
        const updateData = { ...formData };

        // Detectar cambio en el estado activo
        const cambioAInactivo =
          empleado.activo === true && formData.activo === false;
        const cambioAActivo =
          empleado.activo === false && formData.activo === true;

        // Si se desactiva el empleado Y tiene auth_user_id
        if (cambioAInactivo && empleado.auth_user_id) {
          try {
            await eliminarUsuarioAuth(empleado.auth_user_id);
            updateData.auth_user_id = null;
          } catch (authError) {
            console.warn("No se pudo eliminar el usuario Auth:", authError);
            if (
              !confirm(
                "No se pudo eliminar el usuario de autenticación. ¿Desea continuar con la desactivación?"
              )
            ) {
              setLoading(false);
              return;
            }
            updateData.auth_user_id = null;
          }
        }

        // Si se activa el empleado Y NO tiene auth_user_id
        else if (cambioAActivo && !empleado.auth_user_id) {
          try {
            const nuevoAuthUserId = await crearUsuarioAuth(
              formData.email,
              formData.telefono,
              formData.nombre,
              formData.apellido
            );
            updateData.auth_user_id = nuevoAuthUserId;
          } catch (authError) {
            console.warn("No se pudo crear usuario Auth:", authError);
            if (
              !confirm(
                "No se pudo crear el usuario de autenticación. ¿Desea continuar con la activación sin acceso al sistema?"
              )
            ) {
              setLoading(false);
              return;
            }
          }
        }

        // Actualizar empleado en la base de datos
        const { error } = await supabase
          .from("empleados")
          .update(updateData)
          .eq("id", empleado.id);

        if (error) throw error;

        // Mensajes informativos según el cambio
        if (cambioAInactivo) {
          toast.success(
            "Empleado desactivado correctamente. Su acceso al sistema ha sido revocado."
          );
        } else if (cambioAActivo && updateData.auth_user_id) {
          toast.success(
            "Empleado activado correctamente. Se ha creado un nuevo acceso al sistema con contraseña temporal (primeros 6 dígitos del teléfono)."
          );
        } else if (cambioAActivo && !updateData.auth_user_id) {
          toast(
            "Empleado activado correctamente, pero no se pudo crear el acceso al sistema.",
            { icon: "⚠️" }
          );
        }
      } else {
        // CASO 1: Crear nuevo empleado
        let authUserId = null;

        // Solo crear usuario Auth si el empleado se crea como activo
        if (formData.activo) {
          try {
            authUserId = await crearUsuarioAuth(
              formData.email,
              formData.telefono,
              formData.nombre,
              formData.apellido
            );
          } catch (authError) {
            console.warn("No se pudo crear usuario auth:", authError);
            if (
              !confirm(
                "No se pudo crear el usuario de autenticación. ¿Desea continuar creando el empleado sin acceso al sistema?"
              )
            ) {
              setLoading(false);
              return;
            }
          }
        }

        // Crear empleado en la base de datos
        const empleadoData = {
          ...formData,
          auth_user_id: authUserId,
        };

        const { error } = await supabase
          .from("empleados")
          .insert([empleadoData]);

        if (error) throw error;

        if (formData.activo && authUserId) {
          toast.success(
            "Empleado creado exitosamente. La contraseña temporal son los primeros 6 dígitos del teléfono."
          );
        } else if (formData.activo && !authUserId) {
          toast(
            "Empleado creado sin acceso al sistema (no se pudo crear usuario de autenticación).",
            { icon: "⚠️" }
          );
        } else {
          toast.success(
            "Empleado creado como inactivo (sin acceso al sistema)."
          );
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar empleado:", error);
      toast.error("Error al guardar el empleado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    // Validar y limpiar campo de teléfono
    if (field === "telefono") {
      // Remover espacios, guiones, y el prefijo +51
      let cleanedValue = value.replace(/[\s\-+]/g, "").replace(/^51/, "");
      // Solo permitir números
      cleanedValue = cleanedValue.replace(/\D/g, "");
      // Limitar a 9 dígitos (números telefónicos peruanos)
      cleanedValue = cleanedValue.substring(0, 9);
      setFormData((prev) => ({ ...prev, [field]: cleanedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {empleado ? "Editar Empleado" : "Nuevo Empleado"}
          </DialogTitle>
          <DialogDescription>
            {empleado
              ? "Modifica la información del empleado"
              : "Completa los datos para registrar un nuevo empleado. Se creará automáticamente un usuario con acceso al sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombres *</Label>
              <Input
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej: Juan Carlos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellidos *</Label>
              <Input
                id="apellido"
                required
                value={formData.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
                placeholder="Ej: Pérez García"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                type="text"
                required
                inputMode="numeric"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                placeholder="Ej: 987654321"
                maxLength="9"
                pattern="[0-9]*"
              />
              <p className="text-xs text-gray-500">
                Solo números (9 dígitos). Los primeros 6 serán la contraseña
                temporal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                placeholder="Ej: Abogado Senior"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                value={formData.especialidad}
                onChange={(e) => handleChange("especialidad", e.target.value)}
                placeholder="Ej: Derecho Civil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
              <Input
                id="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => handleChange("fecha_ingreso", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol_id">Rol</Label>
              <select
                id="rol_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.rol_id}
                onChange={(e) => handleChange("rol_id", e.target.value)}
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => handleChange("activo", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Empleado activo
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={`cursor-pointer`}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`cursor-pointer`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : empleado ? (
                "Actualizar Empleado"
              ) : (
                "Crear Empleado"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
