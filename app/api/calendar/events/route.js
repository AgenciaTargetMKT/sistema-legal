import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Validar variables de entorno
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.error("Variables de entorno faltantes");
      return NextResponse.json(
        {
          error:
            "Faltan variables de entorno. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
        },
        { status: 500 }
      );
    }

  

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

   
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    

    // Si hay un calendario específico configurado, intentar agregarlo si no está en la lista
    const specificCalendarId = process.env.GOOGLE_CALENDAR_ID;
    if (specificCalendarId) {
   

      const isInList = calendars.some((cal) => cal.id === specificCalendarId);
      if (!isInList) {
       
        try {
          // Intentar obtener información del calendario específico
          const specificCal = await calendar.calendars.get({
            calendarId: specificCalendarId,
          });
       
          calendars.push({
            id: specificCalendarId,
            summary: specificCal.data.summary || "Calendario Específico",
            backgroundColor: specificCal.data.backgroundColor,
          });
        } catch (error) {
          console.error(
            `❌ No se puede acceder al calendario ${specificCalendarId}`
          );
          console.error(
            `💡 SOLUCIÓN: Comparte el calendario con: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
          );
          console.error(`   Pasos:`);
          console.error(`   1. Abre Google Calendar`);
          console.error(
            `   2. Encuentra el calendario con ID: ${specificCalendarId}`
          );
          console.error(
            `   3. Configuración → Compartir con personas específicas`
          );
          console.error(
            `   4. Agrega: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
          );
          console.error(`   5. Permiso: "Ver todos los detalles del evento"`);
        }
      } else {
      
      }
    }

    // Obtener eventos de todos los calendarios
    // Rango: 30 días atrás hasta 60 días adelante
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 días atrás
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60); // 60 días adelante

    const allEvents = [];

    // Obtener eventos de cada calendario
    for (const cal of calendars) {
      try {
    
        const response = await calendar.events.list({
          calendarId: cal.id,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = response.data.items || [];
      

        // Agregar información del calendario a cada evento
        events.forEach((event) => {
          allEvents.push({
            ...event,
            calendarName: cal.summary,
            calendarId: cal.id,
          });
        });
      } catch (error) {
        console.error(
          `  ❌ Error al obtener eventos de ${cal.summary}:`,
          error.message
        );
      }
    }


    // Formatear eventos
    const formattedEvents = allEvents.map((event) => ({
      id: event.id,
      title: event.summary || "Sin título",
      description: event.description || "",
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || "",
      attendees: event.attendees || [],
      htmlLink: event.htmlLink,
      colorId: event.colorId,
      calendarName: event.calendarName,
      calendarId: event.calendarId,
    }));

    return NextResponse.json({
      events: formattedEvents,
      total: formattedEvents.length,
      calendars: calendars.map((cal) => ({
        id: cal.id,
        name: cal.summary,
        color: cal.backgroundColor,
      })),
    });
  } catch (error) {
    console.error("❌ Error al obtener eventos de Google Calendar:", error);
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
