"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { FullCalendarWidget } from "@/components/dashboard/full-calendar-widget";
import TodayDayView from "@/components/dashboard/today-day-view";
import { Card, CardContent } from "@/components/ui/card";

export default function CalendarioPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const fullCalendarRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/events");
      const data = await response.json();

      if (response.ok) {
        const formattedEvents = (data.events || []).map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay || false,
          backgroundColor: "#3b82f6",
          borderColor: "#3b82f6",
          extendedProps: {
            description: event.description,
            location: event.location,
          },
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotClick = (date) => {
    // Trigger dateClick en el FullCalendar del lado derecho
    if (fullCalendarRef.current) {
      fullCalendarRef.current.triggerDateClick(date);
    }
  };

  const handleEventClick = (event) => {
    // Trigger eventClick en el FullCalendar del lado derecho
    if (fullCalendarRef.current) {
      fullCalendarRef.current.triggerEventClick(event);
    }
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="space-y-3">
      {/* Layout de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna izquierda - Vista de HOY personalizada (tarjetas) */}
        <div className="lg:col-span-3">
          <div className="day-view-only bg-transparent border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-[700px]">
                <p className="text-sm text-gray-500">Cargando...</p>
              </div>
            ) : (
              <TodayDayView
                events={events}
                onTimeSlotClick={handleTimeSlotClick}
                onEventClick={handleEventClick}
              />
            )}
          </div>
        </div>

        {/* Columna derecha - Vista MENSUAL CON todas las herramientas (MÁS GRANDE) */}
        <div className="lg:col-span-9">
          <FullCalendarWidget
            ref={fullCalendarRef}
            onEventUpdate={fetchEvents}
          />
        </div>
      </div>
    </div>
  );
}
