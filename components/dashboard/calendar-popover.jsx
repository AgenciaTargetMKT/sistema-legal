"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CalendarPopover({ isOpen, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/events");
      const data = await response.json();

      if (response.ok) {
        // Agrupar eventos por día del mes
        const eventsByDay = {};
        (data.events || []).forEach((event) => {
          const startDate = new Date(event.start);
          const day = startDate.getDate();
          const month = startDate.getMonth();
          const year = startDate.getFullYear();

          // Solo incluir eventos del mes actual mostrado
          if (
            month === currentDate.getMonth() &&
            year === currentDate.getFullYear()
          ) {
            if (!eventsByDay[day]) {
              eventsByDay[day] = [];
            }

            const time = startDate.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });

            eventsByDay[day].push({
              id: event.id,
              title: event.title,
              time: time,
              color: "bg-blue-100 text-blue-700",
              description: event.description,
            });
          }
        });
        setEvents(eventsByDay);
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasEvents = (day) => {
    return events[day] && events[day].length > 0;
  };

  const getEventsForDay = (day) => {
    return events[day] || [];
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

  const daysOfWeek = ["D", "L", "M", "M", "J", "V", "S"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Calendar Popover - Positioned relative to calendar button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
        className="fixed top-[72px] right-[280px] z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-visible"
      >
        {/* Triangle pointer */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="absolute -top-2 right-[110px] w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"
        />
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 border-b border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("month")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  view === "month"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                MES
              </button>
              <button
                onClick={() => setView("year")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  view === "year"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                AÑO
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <button
            onClick={handleToday}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            HOY
          </button>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-4"
        >
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-semibold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2 relative">
            {days.map((day, index) => {
              const dayHasEvents = day && hasEvents(day);
              const dayEvents = day ? getEventsForDay(day) : [];

              return (
                <div key={index} className="relative">
                  <button
                    disabled={!day}
                    onMouseEnter={() => day && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`
                      w-full aspect-square flex flex-col items-center justify-center text-sm rounded-lg
                      transition-all relative
                      ${!day ? "invisible" : ""}
                      ${
                        isToday(day)
                          ? "bg-blue-500 text-white font-bold hover:bg-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                      ${dayHasEvents ? "font-semibold" : ""}
                    `}
                  >
                    {day}
                    {dayHasEvents && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isToday(day) ? "bg-white" : "bg-blue-500"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Hover tooltip */}
                  {hoveredDay === day && dayEvents.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        {day} de {monthNames[currentDate.getMonth()]}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-2 rounded-lg ${event.color} text-xs`}
                          >
                            <div className="font-semibold">{event.title}</div>
                            <div className="flex items-center gap-1 mt-1 opacity-75">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-4 border-t border-gray-100"
        >
          <Link href="/calendario">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg"
                onClick={onClose}
              >
                Ver Calendario Completo
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </>
  );
}
