"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, Save, AlertCircle } from "lucide-react";

export default function ProcesoDialog({
  open,
  onOpenChange,
  proceso,
  onSuccess,
}) {
  const esEdicion = !!proceso?.id;

  const [formData, setFormData] = useState({
    numero_proceso: "",
    nombre: "",
    cliente_id: "",
    materia_id: "",
    estado_id: "",
    tipo_proceso_id: "",
    contra_parte: "",
    pretensiones: "",
    dependencia: "",
    fecha_inicio: "",
    fecha_proximo_contacto: "",
    impulso: false,
    estado_general: "activo",
    observaciones: "",
  });

  const [clientes, setClientes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      cargarDatos();
      if (proceso?.id) {
        setFormData({
          numero_proceso: proceso.numero_proceso || "",
          nombre: proceso.nombre || "",
          cliente_id: proceso.cliente_id || "",
          materia_id: proceso.materia_id || "",
          estado_id: proceso.estado_id || "",
          tipo_proceso_id: proceso.tipo_proceso_id || "",
          contra_parte: proceso.contra_parte || "",
          pretensiones: proceso.pretensiones || "",
          dependencia: proceso.dependencia || "",
          fecha_inicio: proceso.fecha_inicio || "",
          fecha_proximo_contacto: proceso.fecha_proximo_contacto || "",
          impulso: proceso.impulso || false,
          estado_general: proceso.estado_general || "activo",
          observaciones: proceso.observaciones || "",
        });
      } else {
        resetForm();
      }
    }
  }, [open, proceso]);

  const resetForm = () => {
    setFormData({
      numero_proceso: "",
      nombre: "",
      cliente_id: "",
      materia_id: "",
      estado_id: "",
      tipo_proceso_id: "",
      contra_parte: "",
      pretensiones: "",
      dependencia: "",
      fecha_inicio: "",
      fecha_proximo_contacto: "",
      impulso: false,
      estado_general: "activo",
      observaciones: "",
    });
    setError(null);
  };

  const cargarDatos = async () => {
    try {
      const [clientesRes, materiasRes, estadosRes, tiposRes] =
        await Promise.all([
          supabase.from("clientes").select("id, nombre").order("nombre"),
          supabase.from("materias").select("id, nombre").order("nombre"),
          supabase
            .from("estados_proceso")
            .select("id, nombre, color")
            .order("nombre"),
          supabase.from("tipos_proceso").select("id, nombre").order("nombre"),
        ]);

      if (clientesRes.error) throw clientesRes.error;
      if (materiasRes.error) throw materiasRes.error;
      if (estadosRes.error) throw estadosRes.error;
      if (tiposRes.error) throw tiposRes.error;

      setClientes(clientesRes.data || []);
      setMaterias(materiasRes.data || []);
      setEstados(estadosRes.data || []);
      setTiposProceso(tiposRes.data || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los datos del formulario");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.numero_proceso.trim()) {
        throw new Error("El número de proceso es obligatorio");
      }
      if (!formData.nombre.trim()) {
        throw new Error("El nombre del proceso es obligatorio");
      }
      if (!formData.cliente_id) {
        throw new Error("Debes seleccionar un cliente");
      }

      const dataToSave = {
        numero_proceso: formData.numero_proceso.trim(),
        nombre: formData.nombre.trim(),
        cliente_id: formData.cliente_id,
        materia_id: formData.materia_id || null,
        estado_id: formData.estado_id || null,
        tipo_proceso_id: formData.tipo_proceso_id || null,
        contra_parte: formData.contra_parte.trim() || null,
        pretensiones: formData.pretensiones.trim() || null,
        dependencia: formData.dependencia.trim() || null,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_proximo_contacto: formData.fecha_proximo_contacto || null,
        impulso: formData.impulso,
        estado_general: formData.estado_general,
        observaciones: formData.observaciones.trim() || null,
      };

      if (esEdicion) {
        const { error } = await supabase
          .from("procesos")
          .update(dataToSave)
          .eq("id", proceso.id);

        if (error) throw error;
      } else {
        // Para nuevos procesos, obtener el último orden
        const { data: procesosOrden, error: errorOrden } = await supabase
          .from("procesos")
          .select("orden")
          .order("orden", { ascending: false })
          .limit(1);

        if (errorOrden && errorOrden.code !== "42703") {
          console.error("Error al obtener orden:", errorOrden);
        }

        const nuevoOrden =
          procesosOrden?.[0]?.orden != null ? procesosOrden[0].orden + 1 : 0;

        const { error } = await supabase
          .from("procesos")
          .insert({ ...dataToSave, orden: nuevoOrden });

        if (error) throw error;
      }

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar proceso:", error);
      setError(error.message || "Error al guardar el proceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {esEdicion ? "Editar Proceso" : "Nuevo Proceso"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Modifica la información del proceso legal"
              : "Completa los datos del nuevo proceso legal"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_proceso">
                  Número de Proceso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numero_proceso"
                  value={formData.numero_proceso}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_proceso: e.target.value })
                  }
                  placeholder="Ej: 2024-00123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_inicio: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre del Proceso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Proceso de divorcio - Juan Pérez"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_id">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <select
                  id="cliente_id"
                  value={formData.cliente_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materia_id">Materia</Label>
                <select
                  id="materia_id"
                  value={formData.materia_id}
                  onChange={(e) =>
                    setFormData({ ...formData, materia_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Seleccionar materia...</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado_id">Estado</Label>
                <select
                  id="estado_id"
                  value={formData.estado_id}
                  onChange={(e) =>
                    setFormData({ ...formData, estado_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Seleccionar estado...</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_proceso_id">Tipo de Proceso</Label>
                <select
                  id="tipo_proceso_id"
                  value={formData.tipo_proceso_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_proceso_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposProceso.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Detalles del Proceso */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Detalles del Proceso
            </h3>

            <div className="space-y-2">
              <Label htmlFor="contra_parte">Contraparte (VS.)</Label>
              <Input
                id="contra_parte"
                value={formData.contra_parte}
                onChange={(e) =>
                  setFormData({ ...formData, contra_parte: e.target.value })
                }
                placeholder="Nombre de la contraparte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pretensiones">Pretensiones</Label>
              <textarea
                id="pretensiones"
                value={formData.pretensiones}
                onChange={(e) =>
                  setFormData({ ...formData, pretensiones: e.target.value })
                }
                placeholder="Describe las pretensiones del proceso..."
                className="w-full px-3 py-2 border rounded-md min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependencia">Dependencia</Label>
              <Input
                id="dependencia"
                value={formData.dependencia}
                onChange={(e) =>
                  setFormData({ ...formData, dependencia: e.target.value })
                }
                placeholder="Ej: Juzgado 1° Civil"
              />
            </div>
          </div>

          {/* Seguimiento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Seguimiento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_proximo_contacto">Próximo Contacto</Label>
                <Input
                  id="fecha_proximo_contacto"
                  type="date"
                  value={formData.fecha_proximo_contacto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_proximo_contacto: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_general">Estado General</Label>
                <select
                  id="estado_general"
                  value={formData.estado_general}
                  onChange={(e) =>
                    setFormData({ ...formData, estado_general: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="activo">Activo</option>
                  <option value="concluido">Concluido</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="impulso"
                checked={formData.impulso}
                onChange={(e) =>
                  setFormData({ ...formData, impulso: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="impulso" className="font-normal cursor-pointer">
                Marcar como impulso (requiere atención urgente)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Observaciones adicionales sobre el proceso..."
                className="w-full px-3 py-2 border rounded-md min-h-20"
              />
            </div>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {esEdicion ? "Guardar Cambios" : "Crear Proceso"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
