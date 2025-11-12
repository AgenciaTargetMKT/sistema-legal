"use client";

import { useState, useEffect } from "react";
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
import { Calendar, Clock, MapPin, FileText, Trash2 } from "lucide-react";

export function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  mode = "create",
}) {
  function formatDateForInput(date) {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);

  // Actualizar el formulario cuando cambie el evento
  useEffect(() => {
    console.log("EventDialog - Evento recibido:", event);
    console.log("EventDialog - Mode:", mode);

    if (event) {
      const newFormData = {
        title: event.title || "",
        description: event.extendedProps?.description || "",
        start: formatDateForInput(event.start),
        end: formatDateForInput(event.end),
        location: event.extendedProps?.location || "",
      };

      console.log("EventDialog - Form data a establecer:", newFormData);
      setFormData(newFormData);
    } else {
      // Limpiar el formulario si no hay evento
      setFormData({
        title: "",
        description: "",
        start: "",
        end: "",
        location: "",
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        location: formData.location,
      };

      if (mode === "edit" && event?.id) {
        eventData.eventId = event.id;
      }

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error("Error al guardar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Crear Nuevo Evento" : "Editar Evento"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Agrega un nuevo evento a tu calendario de Google"
                : "Modifica los detalles del evento"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Título */}
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Reunión con cliente"
                required
              />
            </div>

            {/* Descripción */}
            <div className="grid gap-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descripción
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalles adicionales del evento..."
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Fecha y hora de inicio */}
            <div className="grid gap-2">
              <Label htmlFor="start" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fecha y hora de inicio *
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                required
              />
            </div>

            {/* Fecha y hora de fin */}
            <div className="grid gap-2">
              <Label htmlFor="end" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fecha y hora de fin *
              </Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                required
              />
            </div>

            {/* Ubicación */}
            <div className="grid gap-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Ej: Oficina, Sala de juntas..."
              />
            </div>
          </div>

          <DialogFooter>
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={loading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : mode === "create"
                ? "Crear Evento"
                : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
