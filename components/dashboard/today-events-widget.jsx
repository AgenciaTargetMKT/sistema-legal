"use client";

import { Clock, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export function TodayEventsWidget() {
  // Eventos de ejemplo (más adelante se cargarán desde la base de datos)
  const todayEvents = [
    {
      id: 1,
      title: "Reunión con Cliente",
      time: "10:00 - 11:30",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: 2,
      title: "Audiencia Legal",
      time: "14:00 - 16:00",
      color: "bg-purple-100 text-purple-700 border-purple-200",
    },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
        {todayEvents.length === 0 ? (
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
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {event.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
