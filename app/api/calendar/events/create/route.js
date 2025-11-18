import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      start,
      end,
      location,
      attendees,
      taskId,
      allDay,
      responsable,
      designado,
      cliente,
    } = body;

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

    // ANTES de crear, verificar si ya existe un evento para este taskId
    if (taskId) {
      try {
     

        const existingEvents = await calendar.events.list({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          maxResults: 250,
          orderBy: "updated",
        });

        const alreadyExists = existingEvents.data.items?.find(
          (event) =>
            event.extendedProperties?.private?.taskId === taskId ||
            event.description?.includes(`[Task ID: ${taskId}]`)
        );

        if (alreadyExists) {
         

          // Actualizar el evento existente en lugar de crear uno nuevo
          const updatedEvent = await calendar.events.update({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: alreadyExists.id,
            resource: {
              summary: title,
              description: taskId
                ? `${description || ""}

[Task ID: ${taskId}]`
                : description || "",
              start: { dateTime: start, timeZone: "America/Lima" },
              end: { dateTime: end, timeZone: "America/Lima" },
            },
            sendUpdates: "none",
          });

          return NextResponse.json({
            success: true,
            event: {
              id: updatedEvent.data.id,
              title: updatedEvent.data.summary,
              start: updatedEvent.data.start.dateTime,
              end: updatedEvent.data.end.dateTime,
              htmlLink: updatedEvent.data.htmlLink,
            },
            message: "Evento actualizado (ya existía)",
          });
        }
      } catch (checkError) {
        console.warn("⚠️ Error verificando eventos existentes:", checkError);
        // Continuar con la creación normal si falla la verificación
      }
    }

    // Función para determinar el color del evento según el tipo de tarea
    // Colores mapeados a los más cercanos disponibles en Google Calendar:
    // Rojo vino (#C0392B) → 11 (Tomate/Rojo)
    // Azul profundo (#1F618D) → 9 (Arándano/Azul oscuro)
    // Verde azulado (#1ABC9C) → 7 (Pavo real/Turquesa)
    // Ambar moderno (#F1C40F) → 5 (Banana/Amarillo)
    // Gris azulado (#5D6D7E) → 8 (Grafito/Gris)
    const getEventColor = (title) => {
      const upperTitle = title.toUpperCase();
      if (upperTitle.includes("VENCIMIENTO")) return "11"; // Rojo vino
      if (upperTitle.includes("AUDIENCIA")) return "9"; // Azul profundo
      if (upperTitle.includes("REUNION") || upperTitle.includes("REUNIÓN"))
        return "7"; // Verde azulado
      if (upperTitle.includes("SEGUIMIENTO")) return "5"; // Ambar moderno
      return "8"; // Gris azulado - predeterminado
    };

    // Función para agregar emoji de estado al título
    const addStatusEmojiToTitle = (title, completed = false) => {
      // Emoji de estado: 🟢 completado, 🟠 pendiente
      const statusEmoji = completed ? "🟢" : "🟠";
      return `${statusEmoji} ${title}`;
    };

    // Función para crear descripción enriquecida
    const createRichDescription = (
      description,
      taskId,
      title,
      responsable,
      designado,
      cliente
    ) => {
      // Inicializar descripción vacía
      let richDesc = "";

      // Guardar TODA la descripción proporcionada
      if (description) {
        richDesc += `${description}\n\n`;
      }

      // Agregar información de responsables, designado y cliente
      if (responsable || designado || cliente) {
        richDesc += `━━━━━━━━━━━━━━━━━━━━━\n`;
        if (responsable) {
          richDesc += `👤 Responsable(s): ${responsable}\n`;
        }
        if (designado) {
          richDesc += `👨‍💼 Designado: ${designado}\n`;
        }
        if (cliente) {
          richDesc += `🏢 Cliente: ${cliente}\n`;
        }
        richDesc += `━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      if (taskId) {
        richDesc += `🔗 ID: ${taskId}`;
      }
      return richDesc;
    };

    // Crear evento
    const colorId = getEventColor(title);
    const titleWithEmoji = addStatusEmojiToTitle(title, false); // Nuevas tareas siempre pendientes
    const event = {
      summary: titleWithEmoji,
      description: createRichDescription(
        description,
        taskId,
        title,
        responsable,
        designado,
        cliente
      ),
      location: location || "",
      colorId: colorId,
      start: allDay
        ? { date: start } // Para evento de todo el día
        : { dateTime: start, timeZone: "America/Lima" }, // Para evento con hora
      end: allDay
        ? { date: end } // Para evento de todo el día
        : { dateTime: end, timeZone: "America/Lima" }, // Para evento con hora
      // Guardar taskId en extended properties para búsqueda futura
      extendedProperties: taskId
        ? {
            private: {
              taskId: taskId,
              createdBy: "sistema-legal",
              createdAt: new Date().toISOString(),
            },
          }
        : undefined,
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

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
      // Cambiar a "none" para no enviar notificaciones
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
      message: "Evento creado exitosamente",
    });
  } catch (error) {

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
