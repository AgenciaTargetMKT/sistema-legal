"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClienteDialog from "@/components/features/clientes/cliente-dialog";
import { useClientes } from "@/hooks/useQueries";
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
} from "lucide-react";

export default function ClientesPage() {
  // 🚀 React Query - datos con caché
  const { data: clientes = [], isLoading, refetch } = useClientes();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const handleNuevoCliente = useCallback(() => {
    setClienteSeleccionado(null);
    setDialogOpen(true);
  }, []);

  const handleEditarCliente = useCallback((cliente) => {
    setClienteSeleccionado(cliente);
    setDialogOpen(true);
  }, []);

  // 🎯 Memoizar filtrado
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm) return clientes;

    const searchLower = searchTerm.toLowerCase();
    return clientes.filter((cliente) => {
      return (
        cliente.nombre?.toLowerCase().includes(searchLower) ||
        cliente.documento_identidad?.toLowerCase().includes(searchLower) ||
        cliente.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [clientes, searchTerm]);

  // 🎯 Memoizar estadísticas
  const stats = useMemo(
    () => ({
      total: clientes.length,
      personaNatural: clientes.filter(
        (c) => c.tipo_cliente === "persona_natural"
      ).length,
      empresa: clientes.filter((c) => c.tipo_cliente === "empresa").length,
      activos: clientes.filter((c) => c.activo === true).length,
    }),
    [clientes]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Button
          onClick={handleNuevoCliente}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Personas Naturales
            </CardTitle>
            <User className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              {stats.personaNatural}
            </div>
            <p className="text-xs text-muted-foreground">Con DNI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.empresa}
            </div>
            <p className="text-xs text-muted-foreground">Con RUC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activos}
            </div>
            <p className="text-xs text-muted-foreground">Con casos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, documento o email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Cargando clientes...
                </p>
              </div>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hay clientes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "No se encontraron clientes con ese criterio"
                  : "Comienza agregando tu primer cliente"}
              </p>
              {!searchTerm && (
                <Button onClick={handleNuevoCliente}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientesFiltrados.map((cliente) => (
                <Card
                  key={cliente.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {cliente.tipo_cliente === "empresa" ? (
                              <Building2 className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{cliente.nombre}</h3>
                            <p className="text-xs text-muted-foreground">
                              {cliente.tipo_cliente === "empresa"
                                ? "Empresa"
                                : "Persona Natural"}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        {cliente.documento_identidad && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">
                              {cliente.tipo_cliente === "empresa"
                                ? "RUC:"
                                : "DNI:"}
                            </span>
                            <span>{cliente.documento_identidad}</span>
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{cliente.email}</span>
                          </div>
                        )}
                        {cliente.telefono && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{cliente.telefono}</span>
                          </div>
                        )}
                        {cliente.direccion && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5" />
                            <span className="text-xs line-clamp-2">
                              {cliente.direccion}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {cliente.condicion && (
                          <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {cliente.condicion}
                          </span>
                        )}
                        {cliente.categoria && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {cliente.categoria}
                          </span>
                        )}
                        {cliente.activo && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditarCliente(cliente)}
                        >
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

      <ClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={clienteSeleccionado}
        onSuccess={refetch}
      />
    </div>
  );
}
