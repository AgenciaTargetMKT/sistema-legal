import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { eventId, taskId } = body;

    if (!eventId && !taskId) {
      return NextResponse.json(
        { error: "ID del evento o ID de la tarea es requerido" },
        { status: 400 }
      );
    }

    // Configurar autenticación
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    let targetEventId = eventId;

    // Si no hay eventId pero hay taskId, buscar el evento
    if (!targetEventId && taskId) {
      try {
        const events = await calendar.events.list({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          privateExtendedProperty: `taskId=${taskId}`,
          maxResults: 1,
        });

        if (events.data.items && events.data.items.length > 0) {
          targetEventId = events.data.items[0].id;
        } else {
          // Búsqueda alternativa
          const allEvents = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            maxResults: 100,
            orderBy: "updated",
          });

          const foundEvent = allEvents.data.items?.find(
            (event) =>
              event.description?.includes(`[Task ID: ${taskId}]`) ||
              event.extendedProperties?.private?.taskId === taskId
          );

          if (foundEvent) {
            targetEventId = foundEvent.id;
          }
        }
      } catch (searchError) {
        console.warn("Error buscando evento por taskId:", searchError);
      }
    }

    if (!targetEventId) {
      return NextResponse.json(
        { error: "No se encontró el evento en el calendario" },
        { status: 404 }
      );
    }

    // Eliminar evento
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: targetEventId,
      sendUpdates: "none",
    });

    return NextResponse.json({
      success: true,
      message: "Evento eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      {
        error: "Error al eliminar evento",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
