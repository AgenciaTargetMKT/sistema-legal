"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");

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

  const daysOfWeek = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

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

  // Eventos de ejemplo
  const events = [
    {
      id: 1,
      title: "Reunión con Cliente",
      time: "10:00 - 11:30",
      date: 22,
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: 2,
      title: "Audiencia Legal",
      time: "14:00 - 16:00",
      date: 22,
      color: "bg-purple-100 text-purple-700 border-purple-200",
    },
    {
      id: 3,
      title: "Revisión de Caso",
      time: "09:00 - 10:00",
      date: 25,
      color: "bg-orange-100 text-orange-700 border-orange-200",
    },
  ];

  const getEventsForDay = (day) => {
    return events.filter((event) => event.date === day);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Calendario de Eventos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tus eventos, audiencias y reuniones
          </p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
          <Plus className="h-4 w-4 mr-2" />
          Crear Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mini Calendar Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView("month")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      view === "month"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    MES
                  </button>
                  <button
                    onClick={() => setView("year")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      view === "year"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    AÑO
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {monthNames[currentDate.getMonth()]}
                  <br />
                  <span className="text-sm font-normal text-gray-500">
                    {currentDate.getFullYear()}
                  </span>
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["D", "L", "M", "M", "J", "V", "S"].map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-xs font-semibold text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
                {days.map((day, index) => (
                  <button
                    key={index}
                    disabled={!day}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg
                      transition-colors
                      ${!day ? "invisible" : ""}
                      ${
                        isToday(day)
                          ? "bg-blue-500 text-white font-bold"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleToday}
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                HOY
              </Button>
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">HOY</h3>
            <div className="text-sm text-gray-600 mb-2">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <div className="space-y-2 mt-4">
              {events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${event.color}`}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </div>
                </div>
              ))}
            </div>
            <button className="text-blue-600 text-sm font-medium mt-4 hover:text-blue-700">
              Ver todos →
            </button>
          </div>
        </div>

        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handlePrevMonth}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleToday}
                    className="rounded-lg px-4"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleNextMonth}
                    className="rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* View Selector */}
              <div className="flex gap-2">
                <Button
                  variant={view === "month" ? "default" : "outline"}
                  onClick={() => setView("month")}
                  className="rounded-lg"
                  size="sm"
                >
                  Mes
                </Button>
                <Button
                  variant={view === "week" ? "default" : "outline"}
                  onClick={() => setView("week")}
                  className="rounded-lg"
                  size="sm"
                >
                  Semana
                </Button>
                <Button
                  variant={view === "day" ? "default" : "outline"}
                  onClick={() => setView("day")}
                  className="rounded-lg"
                  size="sm"
                >
                  Día
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-600 py-3"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] p-2 rounded-lg border transition-colors
                        ${
                          !day
                            ? "bg-gray-50 border-gray-100"
                            : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                        }
                        ${
                          isToday(day)
                            ? "ring-2 ring-blue-500 border-blue-500"
                            : ""
                        }
                      `}
                    >
                      {day && (
                        <>
                          <div
                            className={`
                              text-sm font-semibold mb-2 flex items-center justify-center w-7 h-7 rounded-full
                              ${
                                isToday(day)
                                  ? "bg-blue-500 text-white"
                                  : "text-gray-700"
                              }
                            `}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs p-1.5 rounded border ${event.color} cursor-pointer hover:opacity-80 transition-opacity`}
                              >
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>
                                <div className="text-xs opacity-75">
                                  {event.time.split(" - ")[0]}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
