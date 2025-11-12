import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📅 Recibiendo petición para crear evento:", body);

    const { title, description, start, end, location, attendees } = body;

    // Validar campos requeridos
    if (!title || !start || !end) {
      console.error("❌ Faltan campos requeridos:", {
        title: !!title,
        start: !!start,
        end: !!end,
      });
      return NextResponse.json(
        { error: "Título, fecha de inicio y fin son requeridos" },
        { status: 400 }
      );
    }

    console.log("✅ Campos requeridos presentes");

    // Verificar variables de entorno
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.error("❌ GOOGLE_SERVICE_ACCOUNT_EMAIL no configurado");
      return NextResponse.json(
        {
          error: "Configuración de Google Calendar incompleta",
          details: "GOOGLE_SERVICE_ACCOUNT_EMAIL no está configurado",
        },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.error("❌ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY no configurado");
      return NextResponse.json(
        {
          error: "Configuración de Google Calendar incompleta",
          details: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY no está configurado",
        },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_CALENDAR_ID) {
      console.error("❌ GOOGLE_CALENDAR_ID no configurado");
      return NextResponse.json(
        {
          error: "Configuración de Google Calendar incompleta",
          details: "GOOGLE_CALENDAR_ID no está configurado",
        },
        { status: 500 }
      );
    }

    console.log("✅ Variables de entorno configuradas correctamente");
    console.log("📧 Email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log("📅 Calendar ID:", process.env.GOOGLE_CALENDAR_ID);

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

    // Crear evento
    const event = {
      summary: title,
      description: description || "",
      location: location || "",
      start: {
        dateTime: start,
        timeZone: "America/Lima",
      },
      end: {
        dateTime: end,
        timeZone: "America/Lima",
      },
      // NO incluir attendees cuando se usa Service Account sin Domain-Wide Delegation
      // attendees: attendees ? attendees.map((email) => ({ email })) : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 }, // 1 día antes (solo popup, no email)
          { method: "popup", minutes: 30 }, // 30 minutos antes
        ],
      },
    };

    console.log("🔄 Intentando crear evento en Google Calendar...");
    console.log("Evento:", JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
      // Cambiar a "none" para no enviar notificaciones
      sendUpdates: "none",
    });
    console.log("✅ Evento creado exitosamente:", response.data.id);

    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        title: response.data.summary,
        start: response.data.start.dateTime,
        end: response.data.end.dateTime,
        htmlLink: response.data.htmlLink,
      },
      message: "Evento creado exitosamente",
    });
  } catch (error) {
    console.error("Error completo al crear evento:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: "Error al crear evento en Google Calendar",
        details: error.message,
        errorType: error.constructor.name,
        errorCode: error.code,
      },
      { status: 500 }
    );
  }
}
