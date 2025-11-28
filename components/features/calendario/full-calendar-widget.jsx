"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, Plus, Trash2 } from "lucide-react";
import { EventDialog } from "./event-dialog";

export const FullCalendarWidget = forwardRef(function FullCalendarWidget(
  { onEventUpdate },
  ref
) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const calendarRef = useRef(null);

  // Exponer función para que el TodayDayView pueda abrir el diálogo
  useImperativeHandle(ref, () => ({
    triggerDateClick: (date) => {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(end.getHours() + 1);

      setSelectedEvent({
        start,
        end,
      });
      setDialogMode("create");
      setIsDialogOpen(true);
    },
    triggerEventClick: (event) => {
      setSelectedEvent(event);
      setDialogMode("edit");
      setIsDialogOpen(true);
    },
  }));

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/calendar/events");
      const data = await response.json();

      if (response.ok) {
        // Formatear eventos para FullCalendar
        const formattedEvents = (data.events || []).map((event) => ({
          id: event.id,
          title: `${event.title}${
            event.calendarName ? ` (${event.calendarName})` : ""
          }`,
          start: event.start,
          end: event.end,
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          extendedProps: {
            description: event.description,
            location: event.location,
            htmlLink: event.htmlLink,
            calendarName: event.calendarName,
            calendarId: event.calendarId,
          },
        }));
        setEvents(formattedEvents);
      } else {
        console.error("❌ Error al cargar eventos:", data);
      }
    } catch (err) {
      console.error("❌ Error al cargar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (info) => {
    // Crear fechas de inicio y fin
    const start = new Date(info.date);
    const end = new Date(info.date);
    end.setHours(end.getHours() + 1);

    setSelectedEvent({
      start,
      end,
    });
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleEventClick = (info) => {
    const event = info.event;

    setSelectedEvent(event);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleEventDrop = async (info) => {
    try {
      const event = info.event;

      console.log("🔄 Moviendo evento:", {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      });

      // Actualizar en Google Calendar
      const response = await fetch("/api/calendar/events/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          title: event.title,
          start: event.allDay
            ? event.start.toISOString().split("T")[0]
            : event.start.toISOString(),
          end: event.end
            ? event.allDay
              ? event.end.toISOString().split("T")[0]
              : event.end.toISOString()
            : null,
          allDay: event.allDay || false,
        }),
      });

      if (!response.ok) {
        // Si falla, revertir el cambio
        info.revert();
        const error = await response.json();
        console.error("❌ Error al mover evento:", error);
        alert(`Error al mover evento: ${error.error || "Error desconocido"}`);
      } else {
       
        await fetchEvents();
        onEventUpdate?.();
      }
    } catch (error) {
      console.error("❌ Error en handleEventDrop:", error);
      info.revert();
      alert("Error al mover el evento");
    }
  };

  const handleEventResize = async (info) => {
    try {
      const event = info.event;

      // Actualizar duración en Google Calendar
      const response = await fetch("/api/calendar/events/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          title: event.title,
          start: event.allDay
            ? event.start.toISOString().split("T")[0]
            : event.start.toISOString(),
          end: event.end
            ? event.allDay
              ? event.end.toISOString().split("T")[0]
              : event.end.toISOString()
            : null,
          allDay: event.allDay || false,
        }),
      });

      if (!response.ok) {
        // Si falla, revertir el cambio
        info.revert();
        const error = await response.json();
        console.error("❌ Error al redimensionar evento:", error);
        alert(
          `Error al redimensionar evento: ${error.error || "Error desconocido"}`
        );
      } else {
        // Recargar eventos para sincronizar
        await fetchEvents();
        onEventUpdate?.();
      }
    } catch (error) {
      console.error("❌ Error en handleEventResize:", error);
      info.revert();
      alert("Error al redimensionar el evento");
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      const response = await fetch("/api/calendar/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        onEventUpdate?.(); // Notificar al padre que hay cambios
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error al crear evento:", error);
      alert("Error al crear el evento");
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      const response = await fetch("/api/calendar/events/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        onEventUpdate?.(); // Notificar al padre que hay cambios
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      alert("Error al actualizar el evento");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;

    if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/calendar/events/delete?eventId=${selectedEvent.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchEvents();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      alert("Error al eliminar el evento");
    }
  };

  const handleSaveEvent = async (eventData) => {
    if (dialogMode === "create") {
      await handleCreateEvent(eventData);
    } else {
      await handleUpdateEvent(eventData);
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-1">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cargando calendario...
                </p>
              </div>
            </div>
          ) : (
            <div className="fullcalendar-wrapper">
              <FullCalendar
                ref={calendarRef}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  listPlugin,
                ]}
                initialView="dayGridMonth"
                locale={esLocale}
                headerToolbar={{
                  left: "prev,next",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }}
                buttonText={{
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  list: "Lista",
                }}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={2}
                weekends={true}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                height="750px"
                slotMinTime="09:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={true}
                nowIndicator={true}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: false,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        mode={dialogMode}
      />

      <style jsx global>{`
        .fullcalendar-wrapper {
          /* Colores principales - Color personalizado #0088FF */
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #0088ff; /* Color principal de botones */
          --fc-button-border-color: #0088ff;
          --fc-button-hover-bg-color: #0077ee; /* Color al pasar el mouse */
          --fc-button-hover-border-color: #0077ee;
          --fc-button-active-bg-color: #0066dd; /* Color al hacer clic */
          --fc-button-active-border-color: #0066dd;
          --fc-today-bg-color: rgba(
            0,
            136,
            255,
            0.1
          ); /* Fondo del día actual */
          --fc-event-bg-color: #80c0ffff; /* Color de los eventos */
          --fc-event-border-color: #0077ee;
        }

        .fullcalendar-wrapper .fc {
          font-family: inherit;
        }

        /* Estilos de los botones - MÁS REDONDEADOS */
        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 400;
          border-radius: 12px !important; /* Bordes más redondeados */
          padding: 3px 10px !important;
          font-size: 14px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .fullcalendar-wrapper .fc-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        }

        .fullcalendar-wrapper .fc-button:active {
          transform: translateY(0);
        }

        /* Botón activo/seleccionado */
        .fullcalendar-wrapper .fc-button-active {
          background-color: var(--fc-button-active-bg-color) !important;
          border-color: var(--fc-button-active-border-color) !important;
          box-shadow: 0 2px 4px rgba(0, 102, 221, 0.3);
        }

        /* Grupo de botones */
        .fullcalendar-wrapper .fc-button-group {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 12px !important;
          overflow: hidden;
        }

        .fullcalendar-wrapper .fc-button-group > .fc-button {
          border-radius: 0 !important;
          margin: 0 !important;
        }

        .fullcalendar-wrapper .fc-button-group > .fc-button:first-child {
          border-radius: 12px 0 0 12px !important;
        }

        .fullcalendar-wrapper .fc-button-group > .fc-button:last-child {
          border-radius: 0 12px 12px 0 !important;
        }

        /* Encabezado del calendario */
        .fullcalendar-wrapper .fc-toolbar {
          margin-bottom: 1rem !important;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827;
        }

        /* Días de la semana */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: #f9fafb;
          font-weight: 600;
          color: #424344ff;
          padding: 12px 0 !important;
          border: none !important;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }

        /* Celdas de los días */
        .fullcalendar-wrapper .fc-daygrid-day {
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .fullcalendar-wrapper .fc-daygrid-day:hover {
          background-color: #f3f4f6;
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 8px !important;
          font-weight: 500;
          color: #374151;
        }

        /* Día de hoy */
        .fullcalendar-wrapper .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
          border: 2px solid #0088ff !important;
          border-radius: 24px !important;
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          color: #0066dd;
          font-weight: 700;
        }

        /* Eventos */
        .fullcalendar-wrapper .fc-event {
          cursor: pointer;
          border-radius: 18px !important;
          padding: 4px 8px !important;
          margin: 2px 4px !important;
          border: none !important;
          background-color: var(--fc-event-bg-color) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .fullcalendar-wrapper .fc-event:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        }

        .fullcalendar-wrapper .fc-event-title {
          font-weight: 500;
          font-size: 0.5rem;
        }

        .fullcalendar-wrapper .fc-event-time {
          font-weight: 600;
          font-size: 0.75rem;
        }

        /* Vista de semana y día */
        .fullcalendar-wrapper .fc-timegrid-slot {
          height: 3rem !important;
        }

        .fullcalendar-wrapper .fc-timegrid-event {
          border-radius: 18px !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Vista de lista */
        .fullcalendar-wrapper .fc-list-event:hover {
          background-color: #f3f4f6;
        }

        .fullcalendar-wrapper .fc-list-event-dot {
          border-radius: 50%;
          border-color: var(--fc-event-bg-color) !important;
          background-color: var(--fc-event-bg-color) !important;
        }

        /* Scrollbar personalizado */
        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .fullcalendar-wrapper .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Día actual con borde rojo */
        .fullcalendar-wrapper .fc-day-today {
          background-color: rgba(239, 68, 68, 0.05) !important;
          border: 2px solid #ef4444 !important;
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white !important;
          font-weight: 700;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex !important;
          align-items: center;
          justify-content: center;
          margin: 4px;
        }

        /* Mejorar colores de eventos */
        .fullcalendar-wrapper .fc-event {
          background: #3b82f6 !important;
          border: 1px solid #2563eb !important;
          border-radius: 6px !important;
          padding: 4px 7px !important;
          font-weight: 500 !important;
          font-size: 0.5rem !important;
          line-height: 1.4 !important;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.15) !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }

        .fullcalendar-wrapper .fc-event:hover {
          background: #2563eb !important;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
          transform: translateY(-1px) !important;
        }

        .fullcalendar-wrapper .fc-event-title {
          font-weight: 600 !important;
          font-size: 0.6rem !important;
          line-height: 1.3 !important;
        }

        .fullcalendar-wrapper .fc-event-time {
          font-size: 0.7rem !important;
          opacity: 0.95 !important;
          font-weight: 500 !important;
        }

        /* Mejorar el +X más */
        .fullcalendar-wrapper .fc-more-link {
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          color: #3b82f6 !important;
          padding: 2px 4px !important;
          margin-top: 2px !important;
        }

        .fullcalendar-wrapper .fc-more-link:hover {
          color: #2563eb !important;
          text-decoration: underline !important;
        }

        /* Mejorar legibilidad en vista de mes */
        .fullcalendar-wrapper .fc-daygrid-event-harness {
          margin-bottom: 2px !important;
        }

        /* Animaciones */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fullcalendar-wrapper .fc-event {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </>
  );
});
