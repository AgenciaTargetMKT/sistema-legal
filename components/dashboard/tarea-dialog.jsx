"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function TareaDialog({ open, onOpenChange, tarea, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [procesos, setProcesos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [estados, setEstados] = useState([]);
  const [formData, setFormData] = useState({
    proceso_id: "",
    nombre: "",
    descripcion: "",
    estado_id: "",
    empleado_asignado_id: "",
    fecha_limite: "",
    fecha_vencimiento: "",
    prioridad: "media",
    tiempo_estimado: "",
    observaciones: "",
    agregar_a_calendario: true, // Por defecto sí agregar al calendario
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      cargarDatosIniciales();
    }
  }, [open]);

  // Sincronizar formData cuando cambia la tarea
  useEffect(() => {
    if (tarea) {
      setFormData({
        proceso_id: tarea.proceso_id || "",
        nombre: tarea.nombre || "",
        descripcion: tarea.descripcion || "",
        estado_id: tarea.estado_id || "",
        empleado_asignado_id: tarea.empleado_asignado_id || "",
        fecha_limite: tarea.fecha_limite || "",
        fecha_vencimiento: tarea.fecha_vencimiento || "",
        prioridad: tarea.prioridad || "media",
        tiempo_estimado: tarea.tiempo_estimado || "",
        observaciones: tarea.observaciones || "",
        agregar_a_calendario: true,
      });
    } else {
      // Resetear form para nueva tarea
      setFormData({
        proceso_id: "",
        nombre: "",
        descripcion: "",
        estado_id: "",
        empleado_asignado_id: "",
        fecha_limite: "",
        fecha_vencimiento: "",
        prioridad: "media",
        tiempo_estimado: "",
        observaciones: "",
        agregar_a_calendario: true,
      });
    }
  }, [tarea]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar procesos
      const { data: procesosData } = await supabase
        .from("procesos")
        .select("id, numero_proceso, nombre")
        .eq("activo", true)
        .order("numero_proceso");

      // Cargar empleados
      const { data: empleadosData } = await supabase
        .from("empleados")
        .select("id, nombre, apellido, email")
        .eq("activo", true)
        .order("nombre");

      // Cargar estados
      const { data: estadosData } = await supabase
        .from("estados_tarea")
        .select("id, nombre")
        .order("nombre");

      setProcesos(procesosData || []);
      setEmpleados(empleadosData || []);
      setEstados(estadosData || []);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert("Por favor ingresa un nombre para la tarea");
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para guardar
      const dataToSave = {
        proceso_id: formData.proceso_id || null,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        estado_id: formData.estado_id || null,
        empleado_asignado_id: formData.empleado_asignado_id || null,
        fecha_limite: formData.fecha_limite || null,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        prioridad: formData.prioridad,
        tiempo_estimado: formData.tiempo_estimado
          ? parseInt(formData.tiempo_estimado)
          : null,
        observaciones: formData.observaciones || null,
        updated_at: new Date().toISOString(),
      };

      if (tarea) {
        // Actualizar tarea existente
        const { error } = await supabase
          .from("tareas")
          .update(dataToSave)
          .eq("id", tarea.id);

        if (error) throw error;
      } else {
        // Crear nueva tarea
        const { error } = await supabase.from("tareas").insert([dataToSave]);

        if (error) throw error;

        // Crear evento en Google Calendar si hay fecha de vencimiento y el usuario lo seleccionó
        if (formData.fecha_vencimiento && formData.agregar_a_calendario) {
          try {
            await crearEventoCalendario();
          } catch (calendarError) {
            console.error(
              "Error al crear evento en calendario:",
              calendarError
            );

            // Extraer mensaje de error más específico
            let errorMessage =
              "Hubo un error al agregar al calendario de Google";
            if (calendarError.details) {
              errorMessage += `\n\nDetalle: ${calendarError.details}`;
            }
            if (calendarError.errorCode) {
              errorMessage += `\nCódigo: ${calendarError.errorCode}`;
            }

            // No fallar completamente si falla el calendario
            alert(
              `✅ Tarea creada exitosamente en Supabase\n\n⚠️ ${errorMessage}\n\nPor favor verifica la configuración de Google Calendar.`
            );
          }
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error al guardar la tarea:", error);
      alert("Error al guardar la tarea: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearEventoCalendario = async () => {
    // Obtener información adicional para el evento
    const procesoSeleccionado = procesos.find(
      (p) => p.id === formData.proceso_id
    );
    const empleadoSeleccionado = empleados.find(
      (e) => e.id === formData.empleado_asignado_id
    );

    // Preparar fecha y hora del evento
    // Asegurarnos de que la fecha se interprete correctamente en la zona horaria local
    const [year, month, day] = formData.fecha_vencimiento.split("-");

    // Establecer hora de inicio (9:00 AM por defecto)
    const startDate = new Date(year, month - 1, day, 9, 0, 0, 0);

    // Calcular hora de fin basada en tiempo estimado o 1 hora por defecto
    const duracionHoras = formData.tiempo_estimado
      ? parseFloat(formData.tiempo_estimado)
      : 1;
    const endDate = new Date(year, month - 1, day, 9 + duracionHoras, 0, 0, 0);

    console.log("Creando evento con fechas:", {
      fechaVencimiento: formData.fecha_vencimiento,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Preparar descripción del evento
    let descripcion = formData.descripcion || "";
    if (procesoSeleccionado) {
      descripcion += `\n\nProceso: ${procesoSeleccionado.numero_proceso} - ${procesoSeleccionado.nombre}`;
    }
    if (empleadoSeleccionado) {
      descripcion += `\n\nAsignado a: ${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}`;
      if (empleadoSeleccionado.email) {
        descripcion += ` (${empleadoSeleccionado.email})`;
      }
    }
    if (formData.observaciones) {
      descripcion += `\n\nObservaciones: ${formData.observaciones}`;
    }
    descripcion += `\n\nPrioridad: ${formData.prioridad.toUpperCase()}`;

    console.log("Datos del evento a crear:", {
      title: `[TAREA] ${formData.nombre}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      hasDescription: !!descripcion,
    });

    // Crear evento en Google Calendar
    const response = await fetch("/api/calendar/events/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `[TAREA] ${formData.nombre}`,
        description: descripcion,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        // No enviamos attendees porque Service Account no puede invitar sin Domain-Wide Delegation
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response completo:", errorData);

      // Crear objeto de error con toda la información
      const error = new Error(
        errorData.error || "Error al crear evento en calendario"
      );
      error.details = errorData.details;
      error.errorCode = errorData.errorCode;
      error.errorType = errorData.errorType;

      throw error;
    }

    const result = await response.json();
    console.log("✅ Evento creado en Google Calendar:", result);
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarea ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {tarea
              ? "Modifica los datos de la tarea"
              : "Completa el formulario para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proceso */}
          <div className="space-y-2">
            <Label htmlFor="proceso_id">
              Proceso <span className="text-gray-400">(opcional)</span>
            </Label>
            <select
              id="proceso_id"
              name="proceso_id"
              value={formData.proceso_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Seleccionar proceso</option>
              {procesos.map((proceso) => (
                <option key={proceso.id} value={proceso.id}>
                  {proceso.numero_proceso} - {proceso.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre de la Tarea <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Preparar demanda, Asistir a audiencia..."
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe los detalles de la tarea..."
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            />
          </div>

          {/* Estado y Prioridad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado_id">Estado</Label>
              <select
                id="estado_id"
                name="estado_id"
                value={formData.estado_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Seleccionar estado</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Empleado Asignado */}
          <div className="space-y-2">
            <Label htmlFor="empleado_asignado_id">Asignar a</Label>
            <select
              id="empleado_asignado_id"
              name="empleado_asignado_id"
              value={formData.empleado_asignado_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Sin asignar</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_limite">Fecha Límite</Label>
              <Input
                id="fecha_limite"
                name="fecha_limite"
                type="date"
                value={formData.fecha_limite}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha Vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                name="fecha_vencimiento"
                type="date"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Tiempo Estimado */}
          <div className="space-y-2">
            <Label htmlFor="tiempo_estimado">Tiempo Estimado (horas)</Label>
            <Input
              id="tiempo_estimado"
              name="tiempo_estimado"
              type="number"
              min="0"
              step="0.5"
              value={formData.tiempo_estimado}
              onChange={handleChange}
              placeholder="Ej: 4.5"
            />
          </div>

          {/* Checkbox: Agregar a Google Calendar */}
          {!tarea && formData.fecha_vencimiento && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="agregar_a_calendario"
                name="agregar_a_calendario"
                checked={formData.agregar_a_calendario}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    agregar_a_calendario: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <Label
                htmlFor="agregar_a_calendario"
                className="text-sm font-medium cursor-pointer"
              >
                Agregar evento a Google Calendar
              </Label>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales sobre la tarea..."
              className="w-full px-3 py-2 border rounded-md min-h-[80px]"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
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
              ) : tarea ? (
                "Actualizar Tarea"
              ) : (
                "Crear Tarea"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
