"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatearFecha } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCog,
  Plus,
  Search,
  Filter,
  Users,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

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
      empleado.documento_identidad?.toLowerCase().includes(searchLower);

    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activo" && empleado.activo) ||
      (filtroEstado === "inactivo" && !empleado.activo);

    return matchSearch && matchEstado;
  });

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
        <Button size="lg" className="gap-2">
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
                  placeholder="Buscar por nombre, email o documento..."
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
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
                <Button>
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 text-sm">
                        {empleado.documento_identidad && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">DNI:</span>
                            <span>{empleado.documento_identidad}</span>
                          </div>
                        )}
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
                        {empleado.direccion && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5" />
                            <span className="text-xs line-clamp-2">
                              {empleado.direccion}
                            </span>
                          </div>
                        )}
                        {empleado.fecha_contratacion && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">
                              Desde{" "}
                              {formatearFecha(empleado.fecha_contratacion)}
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="mr-1.5 h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
