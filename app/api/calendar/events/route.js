import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Validar variables de entorno
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      !process.env.GOOGLE_CALENDAR_ID
    ) {
      console.error("Variables de entorno faltantes");
      return NextResponse.json(
        {
          error:
            "Faltan variables de entorno. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_CALENDAR_ID",
        },
        { status: 500 }
      );
    }

    console.log(
      "Configurando autenticación para:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );
    console.log("Calendar ID:", process.env.GOOGLE_CALENDAR_ID);

    // Configurar autenticación con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    // Crear cliente de Calendar
    const calendar = google.calendar({ version: "v3", auth });

    // Obtener eventos de los próximos 30 días
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    console.log(
      "Solicitando eventos desde:",
      now.toISOString(),
      "hasta:",
      endDate.toISOString()
    );

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    console.log(`Se encontraron ${events.length} eventos`);

    // Formatear eventos
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.summary || "Sin título",
      description: event.description || "",
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || "",
      attendees: event.attendees || [],
      htmlLink: event.htmlLink,
      colorId: event.colorId,
    }));

    return NextResponse.json({
      events: formattedEvents,
      total: formattedEvents.length,
    });
  } catch (error) {
    console.error("Error al obtener eventos de Google Calendar:", error);
    console.error("Detalles del error:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
    });

    return NextResponse.json(
      {
        error: "Error al obtener eventos del calendario",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
