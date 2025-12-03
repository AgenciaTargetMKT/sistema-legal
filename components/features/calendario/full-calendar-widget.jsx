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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Cargando calendario...</p>
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
              dayMaxEvents={3}
              weekends={true}
              fixedWeekCount={false}
              showNonCurrentDates={true}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              height="auto"
              contentHeight="auto"
              aspectRatio={2}
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
          /* Colores principales mejorados */
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #3b82f6;
          --fc-button-border-color: #3b82f6;
          --fc-button-hover-bg-color: #2563eb;
          --fc-button-hover-border-color: #2563eb;
          --fc-button-active-bg-color: #1d4ed8;
          --fc-button-active-border-color: #1d4ed8;
          --fc-today-bg-color: rgba(239, 68, 68, 0.05);
          --fc-event-bg-color: #3b82f6;
          --fc-event-border-color: #2563eb;
        }

        .fullcalendar-wrapper .fc {
          font-family: inherit;
        }

        /* Estilos de los botones modernos */
        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          border-radius: 8px !important;
          padding: 6px 14px !important;
          font-size: 13px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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

        /* Encabezado del calendario mejorado */
        .fullcalendar-wrapper .fc-toolbar {
          margin-bottom: 1.5rem !important;
          padding: 0 !important;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827;
          text-transform: lowercase;
        }

        .fullcalendar-wrapper .fc-toolbar-title::first-letter {
          text-transform: uppercase;
        }

        /* Días de la semana mejorados */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: #f8fafc;
          font-weight: 600;
          color: #64748b;
          padding: 14px 0 !important;
          border: none !important;
          border-bottom: 2px solid #e2e8f0 !important;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }

        /* Celdas de los días mejoradas - MÁS ALTAS */
        .fullcalendar-wrapper .fc-daygrid-day {
          transition: all 0.2s ease;
          position: relative;
          min-height: 140px !important;
        }

        .fullcalendar-wrapper .fc-daygrid-day-frame {
          min-height: 140px !important;
        }

        .fullcalendar-wrapper .fc-daygrid-day:hover {
          background-color: #f8fafc;
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 8px 12px !important;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
        }

        /* Días de otros meses con mejor contraste */
        .fullcalendar-wrapper .fc-day-other .fc-daygrid-day-number {
          color: #94a3b8;
          font-weight: 500;
        }

        .fullcalendar-wrapper .fc-day-other {
          background-color: #fafafa;
        }

        /* Día de hoy con diseño destacado */
        .fullcalendar-wrapper .fc-day-today {
          background-color: rgba(239, 68, 68, 0.03) !important;
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white !important;
          font-weight: 700;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex !important;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-frame {
          border: 2px solid #ef4444 !important;
        }

        /* Eventos con diseño moderno y MEJOR CONTRASTE */
        .fullcalendar-wrapper .fc-event {
          cursor: pointer;
          border-radius: 6px !important;
          padding: 5px 10px !important;
          margin: 2px 4px !important;
          border: none !important;
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #2563eb 100%
          ) !important;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.25);
          transition: all 0.2s ease;
        }

        .fullcalendar-wrapper .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.35);
        }

        .fullcalendar-wrapper .fc-event-title {
          font-weight: 700;
          font-size: 0.8rem;
          line-height: 1.4;
          color: #ffffff !important;
        }

        .fullcalendar-wrapper .fc-event-time {
          font-weight: 700;
          font-size: 0.75rem;
          opacity: 1;
          color: #ffffff !important;
        }

        .fullcalendar-wrapper .fc-daygrid-event-dot {
          display: none;
        }

        .fullcalendar-wrapper .fc-event-main {
          color: #ffffff !important;
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

        /* Mejorar el +X más con diseño moderno y MEJOR CONTRASTE */
        .fullcalendar-wrapper .fc-more-link {
          font-size: 0.8rem !important;
          font-weight: 700 !important;
          color: #1e40af !important;
          padding: 3px 8px !important;
          margin-top: 3px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
          background-color: #dbeafe !important;
        }

        .fullcalendar-wrapper .fc-more-link:hover {
          background-color: #bfdbfe !important;
          color: #1e3a8a !important;
        }

        /* Mejorar legibilidad en vista de mes */
        .fullcalendar-wrapper .fc-daygrid-event-harness {
          margin-bottom: 2px !important;
        }

        /* Bordes de las celdas más suaves */
        .fullcalendar-wrapper .fc-scrollgrid {
          border-color: #e5e7eb !important;
        }

        .fullcalendar-wrapper td,
        .fullcalendar-wrapper th {
          border-color: #f1f5f9 !important;
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
