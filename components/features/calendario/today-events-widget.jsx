"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export function TodayEventsWidget() {
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    cargarEventosDeHoy();
  }, []);

  const cargarEventosDeHoy = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/events");

      if (!response.ok) {
        console.error("Error al cargar eventos:", response.statusText);
        setTodayEvents([]);
        return;
      }

      const data = await response.json();

      // Filtrar solo eventos de hoy
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const eventosHoy =
        data.events?.filter((event) => {
          const eventStart = new Date(event.start);
          return eventStart >= startOfDay && eventStart <= endOfDay;
        }) || [];

      // Formatear eventos para el widget
      const eventosFormateados = eventosHoy.map((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        const timeString = `${start.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${end.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        // Asignar colores según el calendario
        const colorMap = {
          default: "bg-blue-100 text-blue-700 border-blue-200",
          1: "bg-blue-100 text-blue-700 border-blue-200",
          2: "bg-green-100 text-green-700 border-green-200",
          3: "bg-purple-100 text-purple-700 border-purple-200",
          4: "bg-pink-100 text-pink-700 border-pink-200",
          5: "bg-yellow-100 text-yellow-700 border-yellow-200",
          6: "bg-orange-100 text-orange-700 border-orange-200",
          7: "bg-cyan-100 text-cyan-700 border-cyan-200",
          8: "bg-gray-100 text-gray-700 border-gray-200",
          9: "bg-indigo-100 text-indigo-700 border-indigo-200",
          10: "bg-teal-100 text-teal-700 border-teal-200",
          11: "bg-red-100 text-red-700 border-red-200",
        };

        return {
          id: event.id,
          title: event.summary || "Sin título",
          time: timeString,
          color: colorMap[event.colorId] || colorMap.default,
          location: event.location,
        };
      });

      setTodayEvents(eventosFormateados);
    } catch (error) {
      console.error("Error cargando eventos de hoy:", error);
      setTodayEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">HOY</h3>
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {formattedDate}
          </p>
        </div>
        <Link
          href="/calendario"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          Ver más <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-500 text-sm">Cargando eventos...</p>
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No hay eventos para hoy</p>
          </div>
        ) : (
          todayEvents.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${event.color} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="font-semibold text-sm mb-2">{event.title}</div>
              <div className="flex items-center gap-1 text-xs mb-1">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
              {event.location && (
                <div className="text-xs opacity-75 truncate">
                  📍 {event.location}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
