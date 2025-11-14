import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      eventId,
      taskId,
      title,
      description,
      start,
      end,
      location,
      attendees,
      completed,
    } = body;

    // Validar campos requeridos - puede ser eventId o taskId
    if (!eventId && !taskId) {
      return NextResponse.json(
        { error: "ID del evento o ID de tarea es requerido" },
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

    // Si no hay eventId pero hay taskId, buscar el evento por extended properties
    if (!targetEventId && taskId) {
      try {
        console.log("🔍 Buscando evento por taskId:", taskId);

        // Buscar por extended properties
        const events = await calendar.events.list({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          privateExtendedProperty: `taskId=${taskId}`,
          maxResults: 1,
        });

        if (events.data.items && events.data.items.length > 0) {
          targetEventId = events.data.items[0].id;
          console.log(
            "✅ Evento encontrado por privateExtendedProperty:",
            targetEventId
          );
        } else {
          console.warn(
            "⚠️ No se encontró evento con privateExtendedProperty, intentando búsqueda alternativa..."
          );

          // Intento alternativo: buscar en eventos recientes (hasta 250)
          const allEvents = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            maxResults: 250,
            orderBy: "updated",
          });

          const foundEvent = allEvents.data.items?.find(
            (event) =>
              event.extendedProperties?.private?.taskId === taskId ||
              event.description?.includes(`[Task ID: ${taskId}]`)
          );

          if (foundEvent) {
            targetEventId = foundEvent.id;
            console.log(
              "✅ Evento encontrado en búsqueda alternativa:",
              targetEventId
            );
          } else {
            console.error(
              "❌ No se encontró ningún evento para taskId:",
              taskId
            );
          }
        }
      } catch (searchError) {
        console.error("❌ Error buscando evento por taskId:", searchError);
      }
    }

    if (!targetEventId) {
      return NextResponse.json(
        { error: "No se encontró evento asociado a esta tarea" },
        { status: 404 }
      );
    }

    // Obtener evento actual
    const existingEvent = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: targetEventId,
    });

    // Preparar datos actualizados
    const updatedEvent = {
      summary: title || existingEvent.data.summary,
      description:
        description !== undefined
          ? description
          : existingEvent.data.description,
      location: location !== undefined ? location : existingEvent.data.location,
      start:
        !completed && start
          ? { dateTime: start, timeZone: "America/Lima" }
          : existingEvent.data.start,
      end:
        !completed && end
          ? { dateTime: end, timeZone: "America/Lima" }
          : existingEvent.data.end,
      attendees: attendees
        ? attendees.map((email) => ({ email }))
        : existingEvent.data.attendees,
      // CRÍTICO: Preservar extendedProperties con taskId para futuras búsquedas
      extendedProperties: taskId
        ? {
            private: {
              taskId: taskId,
            },
          }
        : existingEvent.data.extendedProperties,
    };

    // Actualizar evento
    const response = await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: targetEventId,
      resource: updatedEvent,
      sendUpdates: "none",
    });

    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        title: response.data.summary,
        start: response.data.start.dateTime,
        end: response.data.end.dateTime,
        htmlLink: response.data.htmlLink,
      },
      message: "Evento actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar evento",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
