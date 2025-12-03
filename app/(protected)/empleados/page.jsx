"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmpleadoDialog from "@/components/features/empleados/empleado-dialog";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Users,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  Briefcase,
  GraduationCap,
  MapPin,
  User,
} from "lucide-react";

const SUPABASE_FUNCTIONS_URL =
  "https://maketrlnjyibknqhdsah.supabase.co/functions/v1";

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [empleadoEdit, setEmpleadoEdit] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [verDetalleOpen, setVerDetalleOpen] = useState(false);
  const [empleadoDetalle, setEmpleadoDetalle] = useState(null);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("empleados")
        .select(
          `
          *,
          rol:roles_empleados(nombre, descripcion)
        `
        )
        .order("nombre", { ascending: true });

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  const empleadosFiltrados = empleados.filter((empleado) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      empleado.nombre?.toLowerCase().includes(searchLower) ||
      empleado.apellido?.toLowerCase().includes(searchLower) ||
      empleado.email?.toLowerCase().includes(searchLower) ||
      empleado.cargo?.toLowerCase().includes(searchLower);

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activo" && empleado.activo) ||
      (filtroEstado === "inactivo" && !empleado.activo);

    return matchSearch && matchEstado;
  });

  // Funciones para los botones
  const handleNuevoEmpleado = () => {
    setEmpleadoEdit(null);
    setDialogOpen(true);
  };

  const handleEditarEmpleado = (empleado) => {
    setEmpleadoEdit(empleado);
    setDialogOpen(true);
    setMenuAbierto(null);
  };

  const handleVerEmpleado = (empleado) => {
    setEmpleadoDetalle(empleado);
    setVerDetalleOpen(true);
    setMenuAbierto(null);
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

      const response = await fetch("/functions/v1/create-empleado-auth", {
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
      });

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
      // Obtener el token de sesión actual
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
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return true;
    } catch (error) {
      console.error("Error al eliminar usuario auth:", error);
      return false;
    }
  };

  const handleToggleActivo = async (empleado) => {
    const nuevoEstado = !empleado.activo;

    try {
      if (nuevoEstado === false && empleado.auth_user_id) {
        // Desactivar: eliminar usuario Auth
        const authEliminado = await eliminarUsuarioAuth(empleado.auth_user_id);

        if (!authEliminado) {
          console.warn(
            "No se pudo eliminar el usuario Auth, pero continuamos con la actualización"
          );
        }
      }

      // Actualizar estado en la base de datos
      const updateData = { activo: nuevoEstado };

      if (nuevoEstado === false) {
        // Al desactivar, limpiar auth_user_id
        updateData.auth_user_id = null;
      } else if (nuevoEstado === true && !empleado.auth_user_id) {
        // Al activar, crear nuevo usuario Auth
        try {
          const nuevoAuthUserId = await crearUsuarioAuth(
            empleado.email,
            empleado.telefono,
            empleado.nombre,
            empleado.apellido
          );
          updateData.auth_user_id = nuevoAuthUserId;
        } catch (authError) {
          console.warn(
            "No se pudo crear usuario Auth, continuando sin auth:",
            authError
          );
          // Continuamos sin el usuario auth
        }
      }

      const { error } = await supabase
        .from("empleados")
        .update(updateData)
        .eq("id", empleado.id);

      if (error) throw error;

      // Recargar la lista
      await cargarEmpleados();

      if (nuevoEstado === false) {
        alert(
          `Empleado desactivado correctamente. Su acceso al sistema ha sido revocado.`
        );
      } else {
        if (updateData.auth_user_id) {
          alert(
            `Empleado activado correctamente. Se ha creado un nuevo acceso al sistema con contraseña temporal (primeros 6 dígitos del teléfono).`
          );
        } else {
          alert(
            `Empleado activado correctamente, pero no se pudo crear el acceso al sistema.`
          );
        }
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar estado: " + error.message);
    } finally {
      setMenuAbierto(null);
    }
  };

  // Estadísticas
  const stats = {
    total: empleados.length,
    activos: empleados.filter((e) => e.activo).length,
    inactivos: empleados.filter((e) => !e.activo).length,
    admins: empleados.filter(
      (e) => e.rol?.nombre?.toLowerCase() === "administrador"
    ).length,
  };

  const getRolColor = (rolNombre) => {
    switch (rolNombre?.toLowerCase()) {
      case "administrador":
        return "bg-red-100 text-red-700 border-red-200";
      case "abogado":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "asistente":
        return "bg-green-100 text-green-700 border-green-200";
      case "secretario":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (nombre, apellido) => {
    const firstInitial = nombre?.charAt(0).toUpperCase() || "";
    const lastInitial = apellido?.charAt(0).toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground">
            Gestiona el equipo de trabajo del estudio legal
          </p>
        </div>
        <Button
          size="lg"
          className="cursor-pointer gap-2"
          onClick={handleNuevoEmpleado}
        >
          <Plus className="h-5 w-5" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Empleados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activos}
            </div>
            <p className="text-xs text-muted-foreground">Trabajando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.inactivos}
            </div>
            <p className="text-xs text-muted-foreground">Sin actividad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">Con permisos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Empleados</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o cargo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Cargando empleados...
                </p>
              </div>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay empleados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron empleados con ese criterio"
                  : "Comienza agregando tu primer empleado"}
              </p>
              {!searchTerm && (
                <Button onClick={handleNuevoEmpleado}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Empleado
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {empleadosFiltrados.map((empleado) => (
                <Card
                  key={empleado.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                            {getInitials(empleado.nombre, empleado.apellido)}
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {empleado.nombre} {empleado.apellido}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {empleado.rol?.nombre || "Sin rol"}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setMenuAbierto(
                                menuAbierto === empleado.id ? null : empleado.id
                              )
                            }
                            className={`cursor-pointer`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {menuAbierto === empleado.id && (
                            <div className="absolute right-0 top-10 z-10 w-48 rounded-md border bg-white shadow-lg">
                              <div className="p-1">
                                <button
                                  onClick={() => handleVerEmpleado(empleado)}
                                  className="cursor-pointer flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver detalles
                                </button>
                                <button
                                  onClick={() => handleEditarEmpleado(empleado)}
                                  className="cursor-pointer flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggleActivo(empleado)}
                                  className={`cursor-pointer flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 ${
                                    empleado.activo
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {empleado.activo ? (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Activar
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 text-sm">
                        {empleado.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate text-xs">
                              {empleado.email}
                            </span>
                          </div>
                        )}
                        {empleado.telefono && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{empleado.telefono}</span>
                          </div>
                        )}
                        {empleado.cargo && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Cargo:</span>
                            <span className="text-xs">{empleado.cargo}</span>
                          </div>
                        )}
                        {empleado.especialidad && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Especialidad:</span>
                            <span className="text-xs">
                              {empleado.especialidad}
                            </span>
                          </div>
                        )}
                        {empleado.fecha_ingreso && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">
                              Ingreso: {formatearFecha(empleado.fecha_ingreso)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {empleado.rol && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRolColor(
                              empleado.rol.nombre
                            )}`}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {empleado.rol.nombre}
                          </span>
                        )}
                        {empleado.activo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <EmpleadoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empleado={empleadoEdit}
        onSuccess={cargarEmpleados}
      />

      {/* Dialog de Detalles */}
      <Dialog open={verDetalleOpen} onOpenChange={setVerDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalles del Empleado
            </DialogTitle>
            <DialogDescription>
              Información completa del empleado
            </DialogDescription>
          </DialogHeader>

          {empleadoDetalle && (
            <div className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Información Personal
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nombres</Label>
                    <p className="text-sm font-medium">
                      {empleadoDetalle.nombre}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Apellidos</Label>
                    <p className="text-sm font-medium">
                      {empleadoDetalle.apellido}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <p className="text-sm">{empleadoDetalle.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Teléfono
                    </Label>
                    <p className="text-sm">
                      {empleadoDetalle.telefono || "No especificado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Información Laboral
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Cargo
                    </Label>
                    <p className="text-sm">
                      {empleadoDetalle.cargo || "No especificado"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Especialidad
                    </Label>
                    <p className="text-sm">
                      {empleadoDetalle.especialidad || "No especificada"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fecha de Ingreso
                    </Label>
                    <p className="text-sm">
                      {empleadoDetalle.fecha_ingreso
                        ? formatearFecha(empleadoDetalle.fecha_ingreso)
                        : "No especificada"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Rol
                    </Label>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRolColor(
                        empleadoDetalle.rol?.nombre
                      )}`}
                    >
                      {empleadoDetalle.rol?.nombre || "Sin rol asignado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado y Sistema */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Estado y Acceso
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Estado</Label>
                    <div>
                      {empleadoDetalle.activo ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                          <XCircle className="h-4 w-4" />
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Acceso al Sistema
                    </Label>
                    <div>
                      {empleadoDetalle.auth_user_id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                          <CheckCircle className="h-4 w-4" />
                          Con acceso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                          <XCircle className="h-4 w-4" />
                          Sin acceso
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Sistema */}
              {empleadoDetalle.rol?.descripcion && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Descripción del Rol
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {empleadoDetalle.rol.descripcion}
                  </p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setVerDetalleOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setVerDetalleOpen(false);
                    handleEditarEmpleado(empleadoDetalle);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Empleado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
