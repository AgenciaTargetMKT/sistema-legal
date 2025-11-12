import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

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

    // Eliminar evento
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: eventId,
      sendUpdates: "all",
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
