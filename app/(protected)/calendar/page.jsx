"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { FullCalendarWidget } from "../../../components/features/calendar/full-calendar-widget";
import TodayDayView from "../../../components/features/calendar/today-day-view";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

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
    <div className="space-y-6 p-6">
      {/* Calendario completo con card mejorada */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700 overflow-hidden">
        <FullCalendarWidget ref={fullCalendarRef} onEventUpdate={fetchEvents} />
      </Card>
    </div>
  );
}
