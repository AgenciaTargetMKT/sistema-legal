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
      notes,
      start,
      end,
      location,
      attendees,
      completed,
      allDay,
      responsable,
      designado,
      cliente,
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
        // Buscar por extended properties
        const events = await calendar.events.list({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          privateExtendedProperty: `taskId=${taskId}`,
          maxResults: 1,
        });

        if (events.data.items && events.data.items.length > 0) {
          targetEventId = events.data.items[0].id;
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
          } else {
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

    // Funciones auxiliares para colores y descripciones
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
      // Remover emoji existente si lo tiene
      let cleanTitle = title.replace(/^[🟢🟠]\s*/, "");
      // Emoji de estado: 🟢 completado, 🟠 pendiente
      const statusEmoji = completed ? "🟢" : "🟠";
      return `${statusEmoji} ${cleanTitle}`;
    };

    const createRichDescription = (
      description,
      notes,
      taskId,
      title,
      responsable,
      designado,
      cliente
    ) => {
      // Inicializar descripción vacía
      let richDesc = "";

      // Guardar descripción
      if (description) {
        richDesc += `${description}\n\n`;
      }

      // Agregar notas si existen
      if (notes) {
        richDesc += `📝 Notas:\n${notes}\n\n`;
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

    // Preparar datos actualizados
    const baseTitle = title || existingEvent.data.summary;
    // Limpiar título de emojis previos para obtener el título base
    const cleanTitle = baseTitle.replace(/^[🟢🟠]\s*/, "");
    const titleWithEmoji = addStatusEmojiToTitle(
      cleanTitle,
      completed || false
    );
    const colorId = title
      ? getEventColor(cleanTitle)
      : existingEvent.data.colorId;
    const richDescription =
      description !== undefined ||
      notes !== undefined ||
      title ||
      responsable !== undefined ||
      designado !== undefined ||
      cliente !== undefined
        ? createRichDescription(
            description || existingEvent.data.description,
            notes,
            taskId,
            cleanTitle,
            responsable,
            designado,
            cliente
          )
        : existingEvent.data.description;

    const updatedEvent = {
      summary: titleWithEmoji,
      description: richDescription,
      location: location !== undefined ? location : existingEvent.data.location,
      colorId: colorId,
      start:
        !completed && start
          ? allDay
            ? { date: start }
            : { dateTime: start, timeZone: "America/Lima" }
          : existingEvent.data.start,
      end:
        !completed && end
          ? allDay
            ? { date: end }
            : { dateTime: end, timeZone: "America/Lima" }
          : existingEvent.data.end,
      attendees: attendees
        ? attendees.map((email) => ({ email }))
        : existingEvent.data.attendees,
      // CRÍTICO: Preservar extendedProperties con taskId para futuras búsquedas
      extendedProperties: taskId
        ? {
            private: {
              taskId: taskId,
              createdBy: "sistema-legal",
              updatedAt: new Date().toISOString(),
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
