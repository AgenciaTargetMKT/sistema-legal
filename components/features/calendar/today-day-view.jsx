"use client";

import React, { useMemo } from "react";

export default function TodayDayView({
  events = [],
  loading = false,
  onTimeSlotClick = null,
  onEventClick = null,
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isSameDay = (dateStr) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      // Normalizar a medianoche en zona horaria local
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const normalized = new Date(year, month, day);
      return normalized.getTime() === today.getTime();
    } catch (err) {
      return false;
    }
  };

  const eventosHoy = events.filter((ev) => {
    return isSameDay(ev.start);
  });

  eventosHoy.forEach((ev) => {
   
  });

  // Generar horas desde 8am hasta 8pm
  const hours = useMemo(() => {
    const result = [];
    for (let i = 8; i <= 20; i++) {
      result.push(i);
    }
    return result;
  }, []);

  // Calcular posición vertical del evento basado en la hora
  const getEventPosition = (event) => {
    if (event.allDay) return null; // Eventos de todo el día van arriba

    try {
      const start = new Date(event.start);
      const hour = start.getHours();
      const minutes = start.getMinutes();

      // Si está fuera del rango 8am-8pm, no mostrar
      if (hour < 8 || hour >= 20) return null;

      // Calcular offset desde las 8am
      const offsetHours = hour - 8;
      const offsetMinutes = minutes / 60;
      const totalOffset = offsetHours + offsetMinutes;

      // Calcular duración
      let duration = 1; // Por defecto 1 hora
      if (event.end) {
        const end = new Date(event.end);
        const durationMs = end - start;
        duration = durationMs / (1000 * 60 * 60); // Convertir a horas
      }

      return {
        top: `${totalOffset * 60}px`, // 60px por hora
        height: `${Math.max(duration * 60, 30)}px`, // Mínimo 30px
      };
    } catch (err) {
      return null;
    }
  };

  const formatTime = (start, end, allDay) => {
    if (allDay) return "Todo el día";
    try {
      const s = new Date(start);
      const e = end ? new Date(end) : null;
      const opts = { hour: "2-digit", minute: "2-digit" };
      const sStr = s.toLocaleTimeString([], opts);
      const eStr = e ? " - " + e.toLocaleTimeString([], opts) : "";
      return sStr + eStr;
    } catch (err) {
      return "";
    }
  };

  const handleSlotClick = (hour) => {
    if (onTimeSlotClick) {
      // Crear fecha con la hora seleccionada
      const clickDate = new Date(today);
      clickDate.setHours(hour, 0, 0, 0);
      onTimeSlotClick(clickDate);
    }
  };

  // Separar eventos de todo el día y eventos con hora
  const allDayEvents = eventosHoy.filter((ev) => {
    // Solo considerar eventos de todo el día si allDay es explícitamente true
    // O si la fecha es en formato YYYY-MM-DD sin hora
    if (ev.allDay === true) return true;

    if (ev.start && typeof ev.start === "string") {
      // Formato sin hora: YYYY-MM-DD
      if (ev.start.length === 10 && !ev.start.includes("T")) return true;
      // Formato ISO pero sin zona horaria ni hora específica
      if (ev.start.includes("T00:00:00") && !ev.end) return true;
    }

    return false;
  });

  const timedEvents = eventosHoy.filter(
    (ev) => !allDayEvents.includes(ev) && getEventPosition(ev)
  );

  return (
    <div className="flex flex-col h-[800px]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">HOY</h3>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Eventos de todo el día */}
      {allDayEvents.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Todo el día</div>
          <div className="space-y-1">
            {allDayEvents.map((ev) => (
              <div
                key={ev.id || ev.start + ev.title}
                className="text-xs bg-linear-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm font-medium truncate cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all"
                onClick={() => onEventClick && onEventClick(ev)}
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de horas */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="relative" style={{ minHeight: "720px" }}>
          {/* Líneas de hora */}
          {hours.map((hour, idx) => (
            <div
              key={hour}
              className="absolute w-full border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              style={{
                top: `${idx * 60}px`,
                height: "60px",
              }}
              onClick={() => handleSlotClick(hour)}
            >
              <div className="flex">
                <div className="w-16 text-xs text-gray-500 pt-1 pl-3">
                  {hour === 12
                    ? "12 PM"
                    : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
                </div>
                <div className="flex-1"></div>
              </div>
            </div>
          ))}

          {/* Eventos posicionados */}
          <div className="absolute top-0 left-16 right-0 pointer-events-none">
            {timedEvents.map((ev) => {
              const pos = getEventPosition(ev);
              if (!pos) return null;

              return (
                <div
                  key={ev.id || ev.start + ev.title}
                  className="absolute left-2 right-2 pointer-events-auto"
                  style={{
                    top: pos.top,
                    height: pos.height,
                  }}
                >
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-2 overflow-hidden hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
                    onClick={() => onEventClick && onEventClick(ev)}
                  >
                    <div className="text-xs font-semibold truncate">
                      {ev.title}
                    </div>
                    <div className="text-xs opacity-90 truncate mt-0.5">
                      {formatTime(ev.start, ev.end, false)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
