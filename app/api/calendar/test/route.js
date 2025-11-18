import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    config: {},
    auth: {},
    calendars: [],
    specificCalendar: {},
    events: [],
  };

  try {
    // 1. Verificar variables de entorno
    results.config = {
      hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    };

    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      results.auth.error = "Faltan credenciales de Service Account";
      return NextResponse.json(results);
    }

    // 2. Configurar autenticación
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

    results.auth.success = true;
    const calendar = google.calendar({ version: "v3", auth });

    // 3. Obtener lista de calendarios
    try {
      const calendarList = await calendar.calendarList.list();
      results.calendars = (calendarList.data.items || []).map((cal) => ({
        id: cal.id,
        name: cal.summary,
        accessRole: cal.accessRole,
        primary: cal.primary || false,
      }));
    } catch (error) {
      results.calendars = {
        error: error.message,
        code: error.code,
      };
    }

    // 4. Probar acceso al calendario específico
    if (process.env.GOOGLE_CALENDAR_ID) {
      try {
        const specificCal = await calendar.calendars.get({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
        });
        results.specificCalendar = {
          success: true,
          id: specificCal.data.id,
          name: specificCal.data.summary,
          description: specificCal.data.description,
          timezone: specificCal.data.timeZone,
        };

        // 5. Intentar obtener eventos del calendario específico
        try {
          const now = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30); // 30 días atrás
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 60); // 60 días adelante

          const eventsResponse = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: "startTime",
          });

          results.events = (eventsResponse.data.items || []).map((event) => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || "",
            location: event.location || "",
          }));
        } catch (error) {
          results.events = {
            error: "No se pueden obtener eventos",
            message: error.message,
            code: error.code,
          };
        }
      } catch (error) {
        results.specificCalendar = {
          error: "No se puede acceder al calendario",
          message: error.message,
          code: error.code,
          solution: `
🔧 SOLUCIÓN:
1. Ve a Google Calendar: https://calendar.google.com
2. Busca el calendario con ID: ${process.env.GOOGLE_CALENDAR_ID}
3. Click en los 3 puntos → Configuración y compartir
4. En "Compartir con personas específicas" haz click en "Agregar personas"
5. Agrega: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}
6. Selecciona permiso: "Ver todos los detalles del evento"
7. Guarda los cambios
8. Espera 1-2 minutos y vuelve a probar
          `.trim(),
        };
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    results.error = {
      message: error.message,
      stack: error.stack,
    };
    return NextResponse.json(results, { status: 500 });
  }
}
