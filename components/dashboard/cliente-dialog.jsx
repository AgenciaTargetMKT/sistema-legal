"use client";

import { useState, useEffect } from "react";
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
import { Building2, User, Loader2, Search } from "lucide-react";

export default function ClienteDialog({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [consultandoDni, setConsultandoDni] = useState(false);
  const [consultandoRuc, setConsultandoRuc] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo_cliente: "persona_natural",
    documento_identidad: "",
    email: "",
    telefono: "",
    direccion: "",
    condicion: "activo",
    categoria: "",
    activo: true,
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        tipo_cliente: cliente.tipo_cliente || "persona_natural",
        documento_identidad: cliente.documento_identidad || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        condicion: cliente.condicion || "activo",
        categoria: cliente.categoria || "",
        activo: cliente.activo !== undefined ? cliente.activo : true,
      });
    } else {
      // Reset form when creating new
      setFormData({
        nombre: "",
        tipo_cliente: "persona_natural",
        documento_identidad: "",
        email: "",
        telefono: "",
        direccion: "",
        condicion: "activo",
        categoria: "",
        activo: true,
      });
    }
  }, [cliente, open]);

  // Función para validar que solo sean números
  const handleDocumentoChange = (value) => {
    // Remover cualquier caracter que no sea número
    const soloNumeros = value.replace(/[^\d]/g, '');
    handleChange("documento_identidad", soloNumeros);
  };

  // Función para consultar DNI en la API
  const consultarDNI = async (dni) => {
    // Validar que el DNI tenga 8 dígitos
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      return null;
    }

    setConsultandoDni(true);

    try {
      const response = await fetch(
        `/api/consulta-dni?numero=${dni}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error en la consulta: ${response.status}`);
      }

      const data = await response.json();

      // Formatear el nombre completo según la estructura de la API
      if (data.first_name && data.first_last_name) {
        const nombreCompleto = `${data.first_name} ${data.first_last_name}${data.second_last_name ? ` ${data.second_last_name}` : ''}`;
        return nombreCompleto.trim();
      }

      return null;
    } catch (error) {
      console.error("Error al consultar DNI:", error);
      alert(`Error al consultar DNI: ${error.message}`);
      return null;
    } finally {
      setConsultandoDni(false);
    }
  };

  // Función para consultar RUC en la API
  const consultarRUC = async (ruc) => {
    // Validar que el RUC tenga 11 dígitos
    if (!ruc || ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      return null;
    }

    setConsultandoRuc(true);

    try {
      const response = await fetch(
        `/api/consulta-ruc?numero=${ruc}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error en la consulta: ${response.status}`);
      }

      const data = await response.json();

      // Retornar los datos de la empresa
      return {
        razon_social: data.razon_social || "",
        direccion: data.direccion || "",
        estado: data.estado || "",
        condicion: data.condicion || ""
      };
    } catch (error) {
      console.error("Error al consultar RUC:", error);
      alert(`Error al consultar RUC: ${error.message}`);
      return null;
    } finally {
      setConsultandoRuc(false);
    }
  };

  // Función para consultar manualmente DNI
  const handleConsultarManual = async () => {
    if (formData.documento_identidad.length === 8 && /^\d+$/.test(formData.documento_identidad)) {
      const nombreCompleto = await consultarDNI(formData.documento_identidad);
      if (nombreCompleto) {
        setFormData(prev => ({
          ...prev,
          nombre: nombreCompleto
        }));
      } else {
        alert("No se pudo encontrar información para el DNI ingresado");
      }
    } else {
      alert("Por favor ingrese un DNI válido de 8 dígitos");
    }
  };

  // Función para consultar manualmente RUC
  const handleConsultarRucManual = async () => {
    if (formData.documento_identidad.length === 11 && /^\d+$/.test(formData.documento_identidad)) {
      const datosEmpresa = await consultarRUC(formData.documento_identidad);
      if (datosEmpresa) {
        setFormData(prev => ({
          ...prev,
          nombre: datosEmpresa.razon_social,
          direccion: datosEmpresa.direccion || prev.direccion,
          condicion: datosEmpresa.estado === "ACTIVO" ? "activo" : "potencial"
        }));
      } else {
        alert("No se pudo encontrar información para el RUC ingresado");
      }
    } else {
      alert("Por favor ingrese un RUC válido de 11 dígitos");
    }
  };

  // Función para cambiar el tipo de cliente y limpiar campos
  const handleTipoClienteChange = (nuevoTipo) => {
    // Si ya está en el mismo tipo, no hacer nada
    if (formData.tipo_cliente === nuevoTipo) return;

    // Limpiar campos específicos cuando se cambia el tipo
    setFormData(prev => ({
      ...prev,
      tipo_cliente: nuevoTipo,
      nombre: "", // Limpiar nombre/razón social
      documento_identidad: "", // Limpiar DNI/RUC
      direccion: ""
      // Mantener los demás campos (email, teléfono, dirección, etc.)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cliente) {
        // Actualizar cliente existente
        const { error } = await supabase
          .from("clientes")
          .update(formData)
          .eq("id", cliente.id);

        if (error) throw error;
      } else {
        // Crear nuevo cliente
        const { error } = await supabase.from("clientes").insert([formData]);

        if (error) throw error;
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      alert("Error al guardar el cliente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {cliente ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {cliente
              ? "Modifica la información del cliente"
              : "Completa los datos para registrar un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cliente */}
          <div className="space-y-2">
            <Label>Tipo de Cliente *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoClienteChange("persona_natural")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${formData.tipo_cliente === "persona_natural"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-primary/50"
                  }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${formData.tipo_cliente === "persona_natural"
                    ? "bg-primary text-white"
                    : "bg-gray-100"
                    }`}
                >
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Persona Natural</div>
                  <div className="text-xs text-muted-foreground">Con DNI</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTipoClienteChange("empresa")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${formData.tipo_cliente === "empresa"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-primary/50"
                  }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${formData.tipo_cliente === "empresa"
                    ? "bg-primary text-white"
                    : "bg-gray-100"
                    }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Empresa</div>
                  <div className="text-xs text-muted-foreground">Con RUC</div>
                </div>
              </button>
            </div>
          </div>

          {/* Información Básica */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">
                {formData.tipo_cliente === "empresa"
                  ? "Razón Social *"
                  : "Nombres y Apellidos *"}
              </Label>
              <Input
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder={
                  formData.tipo_cliente === "empresa"
                    ? "Ej: Constructora El Sol S.A.C."
                    : "Ej: María González Pérez"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">
                {formData.tipo_cliente === "empresa" ? "RUC" : "DNI"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="documento"
                  value={formData.documento_identidad}
                  onChange={(e) => handleDocumentoChange(e.target.value)}
                  placeholder={
                    formData.tipo_cliente === "empresa"
                      ? "Ej: 20123456789"
                      : "Ej: 12345678"
                  }
                  maxLength={formData.tipo_cliente === "empresa" ? 11 : 8}
                  className="flex-1"
                />
                {formData.tipo_cliente === "persona_natural" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConsultarManual}
                    disabled={consultandoDni || formData.documento_identidad.length !== 8}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    {consultandoDni ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Consultar
                  </Button>
                )}
                {formData.tipo_cliente === "empresa" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConsultarRucManual}
                    disabled={consultandoRuc || formData.documento_identidad.length !== 11}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    {consultandoRuc ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Consultar
                  </Button>
                )}
              </div>
              {consultandoDni && (
                <p className="text-sm text-blue-600">Consultando información del DNI...</p>
              )}
              {consultandoRuc && (
                <p className="text-sm text-blue-600">Consultando información del RUC...</p>
              )}
              {formData.tipo_cliente === "persona_natural" && (
                <p className="text-xs text-gray-500">
                  Ingrese 8 dígitos y presione "Consultar" para buscar automáticamente
                </p>
              )}
              {formData.tipo_cliente === "empresa" && (
                <p className="text-xs text-gray-500">
                  Ingrese 11 dígitos y presione "Consultar" para buscar automáticamente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                placeholder="Ej: +51 987 654 321"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
                placeholder="Ej: Av. Larco 1234, Miraflores, Lima"
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="condicion">Condición</Label>
              <select
                id="condicion"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.condicion}
                onChange={(e) => handleChange("condicion", e.target.value)}
              >
                <option value="activo">Activo</option>
                <option value="potencial">Potencial</option>
                <option value="excelente">Excelente</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="premium">Premium</option>
                <option value="corte">Corte</option>
                <option value="pago">Pago</option>
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
              Cliente activo
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : cliente ? (
                "Actualizar Cliente"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}