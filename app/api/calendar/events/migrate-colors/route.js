import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
  

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
    const addStatusEmojiToTitle = (title) => {
      // Remover emoji existente si lo tiene
      let cleanTitle = title.replace(/^[🟢🟠]\s*/, "");
      // Emoji de estado: 🟠 pendiente por defecto para migración
      return `🟠 ${cleanTitle}`;
    };

    // Función para crear descripción enriquecida
    const createRichDescription = (description, taskId, title) => {
      const upperTitle = title.toUpperCase();

      // Si ya tiene el nuevo formato, no modificar
      if (
        description &&
        description.includes("━━━━━━━━━━━━━━━━━━━━━")
      ) {
        return description;
      }

      if (description) {
        // Si tiene el formato viejo [Task ID: ...], quitarlo
        const descWithoutTaskId = description.replace(
          /\n\n\[Task ID:.*\]$/,
          ""
        );
        // Guardar TODA la descripción
        richDesc += `${descWithoutTaskId}\n\n`;
      }

      richDesc += `━━━━━━━━━━━━━━━━━━━━━\n`;
      if (taskId) {
        richDesc += `🔗 ID: ${taskId}`;
      }
      return richDesc;
    };

    // Obtener todos los eventos del calendario

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      maxResults: 250,
      orderBy: "updated",
    });

    const events = response.data.items || [];
 
    let actualizados = 0;
    let errores = 0;
    const resultados = [];

    for (const event of events) {
      try {
        // Solo actualizar eventos que tienen taskId (creados por el sistema)
        const taskId = event.extendedProperties?.private?.taskId;
        if (!taskId && !event.description?.includes("[Task ID:")) {
        
          continue;
        }

        const colorId = getEventColor(event.summary);
        const currentColorId = event.colorId;

        // Extraer taskId de la descripción si no está en extendedProperties
        let extractedTaskId = taskId;
        if (!extractedTaskId && event.description) {
          const match = event.description.match(/\[Task ID: (.+?)\]/);
          if (match) {
            extractedTaskId = match[1];
          }
        }

        const newDescription = createRichDescription(
          event.description,
          extractedTaskId,
          event.summary
        );

        // Actualizar título con emoji
        const titleWithEmoji = addStatusEmojiToTitle(event.summary);
        const needsUpdate =
          currentColorId !== colorId ||
          !event.description?.includes("━━━━━━━━━━━━━━━━━━━━━") ||
          (!event.summary.includes("🟠") && !event.summary.includes("🟢"));

        // Solo actualizar si el color es diferente o la descripción no tiene el nuevo formato
        if (needsUpdate) {
         
          await calendar.events.update({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: event.id,
            resource: {
              ...event,
              summary: titleWithEmoji,
              colorId: colorId,
              description: newDescription,
              extendedProperties: extractedTaskId
                ? {
                    private: {
                      taskId: extractedTaskId,
                      createdBy: "sistema-legal",
                      migratedAt: new Date().toISOString(),
                    },
                  }
                : event.extendedProperties,
            },
            sendUpdates: "none",
          });

          actualizados++;
          resultados.push({
            id: event.id,
            titulo: event.summary,
            colorAnterior: currentColorId || "ninguno",
            colorNuevo: colorId,
            estado: "actualizado",
          });
        } else {
         
          resultados.push({
            id: event.id,
            titulo: event.summary,
            color: colorId,
            estado: "ya actualizado",
          });
        }
      } catch (error) {
        console.error(`❌ Error actualizando evento ${event.summary}:`, error);
        errores++;
        resultados.push({
          id: event.id,
          titulo: event.summary,
          estado: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Migración completada: ${actualizados} eventos actualizados, ${errores} errores`,
      resumen: {
        total: events.length,
        actualizados,
        errores,
        yaActualizados: events.length - actualizados - errores,
      },
      resultados,
    });
  } catch (error) {
    console.error("❌ Error en migración de colores:", error);
    return NextResponse.json(
      {
        error: "Error en migración de colores",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
