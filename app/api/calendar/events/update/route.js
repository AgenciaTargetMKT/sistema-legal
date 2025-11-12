import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    const body = await request.json();
    const { eventId, title, description, start, end, location, attendees } =
      body;

    // Validar campos requeridos
    if (!eventId) {
      return NextResponse.json(
        { error: "ID del evento es requerido" },
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

    // Obtener evento actual
    const existingEvent = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
    });

    // Preparar datos actualizados
    const updatedEvent = {
      summary: title || existingEvent.data.summary,
      description:
        description !== undefined
          ? description
          : existingEvent.data.description,
      location: location !== undefined ? location : existingEvent.data.location,
      start: start
        ? {
            dateTime: start,
            timeZone: "America/Lima",
          }
        : existingEvent.data.start,
      end: end
        ? {
            dateTime: end,
            timeZone: "America/Lima",
          }
        : existingEvent.data.end,
      attendees: attendees
        ? attendees.map((email) => ({ email }))
        : existingEvent.data.attendees,
    };

    // Actualizar evento
    const response = await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
      resource: updatedEvent,
      sendUpdates: "all",
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
