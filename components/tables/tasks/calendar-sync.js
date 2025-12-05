/**
 * Funciones de sincronización con Google Calendar
 * Extraídas de task-panel.jsx para reducir el tamaño del archivo principal
 */

import toast from "react-hot-toast";

/**
 * Verifica si una tarea debe sincronizarse con Google Calendar
 * basándose en prefijos específicos en el nombre
 */
export const debeSincronizarConCalendario = (nombreTarea) => {
  if (!nombreTarea) return false;
  const nombreUpper = nombreTarea.toUpperCase();
  return (
    nombreUpper.startsWith("VENCIMIENTO") ||
    nombreUpper.startsWith("SEGUIMIENTO") ||
    nombreUpper.startsWith("AUDIENCIA") ||
    nombreUpper.startsWith("REUNIÓN") ||
    nombreUpper.startsWith("REUNION")
  );
};

/**
 * Extrae los nombres de empleados para mostrar en el calendario
 */
export const extraerNombresEmpleados = (empleados) => {
  if (!empleados || !Array.isArray(empleados)) return "";
  return empleados
    .map((e) => {
      const emp = e.empleado || e;
      return emp.nombre || emp.nombre_completo || "";
    })
    .filter(Boolean)
    .join(", ");
};

/**
 * Crea las fechas de inicio y fin para un evento de calendario
 */
export const crearFechasEvento = (
  fechaStr,
  esTodoElDia,
  horaInicio,
  horaFin
) => {
  const [year, month, day] = fechaStr.split("-");

  if (esTodoElDia) {
    return {
      fechaVencimiento: fechaStr,
      fechaFin: fechaStr,
    };
  }

  const [horaIni, minIni] = horaInicio.split(":");
  const [horaEnd, minEnd] = horaFin.split(":");

  const fechaVencimiento = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(horaIni),
    parseInt(minIni),
    0
  );
  const fechaFin = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(horaEnd),
    parseInt(minEnd),
    0
  );

  return { fechaVencimiento, fechaFin };
};

/**
 * Crea un evento en Google Calendar
 */
export const crearEventoCalendario = async (datos) => {
  const {
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    taskId,
    esTodoElDia,
    responsable,
    designado,
    cliente,
  } = datos;

  const response = await fetch("/api/calendar/events/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: titulo,
      description: descripcion || "Tarea pendiente",
      start: esTodoElDia ? fechaInicio : fechaInicio.toISOString(),
      end: esTodoElDia ? fechaFin : fechaFin.toISOString(),
      taskId,
      allDay: esTodoElDia,
      responsable: responsable || "",
      designado: designado || "",
      cliente: cliente || "",
    }),
  });

  return response;
};

/**
 * Actualiza un evento en Google Calendar
 */
export const actualizarEventoCalendario = async (datos) => {
  const {
    taskId,
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    esTodoElDia,
    completed,
    responsable,
    designado,
    cliente,
    notes,
  } = datos;

  const body = { taskId };

  if (titulo !== undefined) body.title = titulo;
  if (descripcion !== undefined) body.description = descripcion;
  if (notes !== undefined) body.notes = notes;
  if (fechaInicio !== undefined) {
    body.start = esTodoElDia ? fechaInicio : fechaInicio.toISOString();
  }
  if (fechaFin !== undefined) {
    body.end = esTodoElDia ? fechaFin : fechaFin.toISOString();
  }
  if (esTodoElDia !== undefined) body.allDay = esTodoElDia;
  if (completed !== undefined) body.completed = completed;
  if (responsable !== undefined) body.responsable = responsable;
  if (designado !== undefined) body.designado = designado;
  if (cliente !== undefined) body.cliente = cliente;

  const response = await fetch("/api/calendar/events/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response;
};

/**
 * Sincroniza el título de una tarea con Google Calendar
 */
export const sincronizarTituloConCalendario = async ({
  tarea,
  nuevoTitulo,
  sincronizabaAntes,
  calendarioEnProgreso,
}) => {
  const calendarioKey = `titulo-${tarea.id}`;
  if (calendarioEnProgreso.current.has(calendarioKey)) return;

  calendarioEnProgreso.current.add(calendarioKey);

  try {
    const [year, month, day] = tarea.fecha_vencimiento.split("-");
    const fechaVencimiento = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      9,
      0,
      0
    );
    const fechaFin = new Date(fechaVencimiento);
    fechaFin.setHours(10, 0, 0, 0);

    if (!sincronizabaAntes) {
      await crearEventoCalendario({
        titulo: nuevoTitulo,
        descripcion: tarea?.descripcion,
        fechaInicio: fechaVencimiento.toISOString(),
        fechaFin: fechaFin.toISOString(),
        taskId: tarea.id,
        esTodoElDia: false,
      });
      toast.success("Evento creado en Google Calendar");
    } else {
      await actualizarEventoCalendario({
        taskId: tarea.id,
        titulo: nuevoTitulo,
      });
    }
  } catch (calendarError) {
    console.warn(
      "⚠️ Error sincronizando título con calendario:",
      calendarError
    );
  } finally {
    setTimeout(() => {
      calendarioEnProgreso.current.delete(calendarioKey);
    }, 1000);
  }
};

/**
 * Sincroniza el estado completado con Google Calendar
 */
export const sincronizarEstadoConCalendario = async ({
  tarea,
  calendarioEnProgreso,
}) => {
  const calendarioKey = `estado-${tarea.id}`;
  if (calendarioEnProgreso.current.has(calendarioKey)) return;

  calendarioEnProgreso.current.add(calendarioKey);

  try {
    await actualizarEventoCalendario({
      taskId: tarea.id,
      titulo: tarea.nombre,
      completed: true,
      responsable: extraerNombresEmpleados(tarea.empleados_responsables),
      designado: extraerNombresEmpleados(tarea.empleados_designados),
      cliente: tarea.cliente?.nombre || "",
    });
  } catch (calError) {
    console.warn("⚠️ Error actualizando estado en calendario:", calError);
  } finally {
    setTimeout(() => {
      calendarioEnProgreso.current.delete(calendarioKey);
    }, 1000);
  }
};

/**
 * Sincroniza la fecha de vencimiento con Google Calendar
 */
export const sincronizarFechaConCalendario = async ({
  tarea,
  nuevaFecha,
  esTodoElDia,
  horaInicio,
  horaFin,
  calendarioEnProgreso,
}) => {
  const calendarioKey = `fecha-${tarea.id}`;
  if (calendarioEnProgreso.current.has(calendarioKey)) return;

  calendarioEnProgreso.current.add(calendarioKey);

  try {
    const { fechaVencimiento, fechaFin: fechaFinEvento } = crearFechasEvento(
      nuevaFecha,
      esTodoElDia,
      horaInicio,
      horaFin
    );

    const response = await actualizarEventoCalendario({
      taskId: tarea.id,
      titulo: tarea.nombre,
      descripcion: tarea.descripcion,
      fechaInicio: fechaVencimiento,
      fechaFin: fechaFinEvento,
      esTodoElDia,
      responsable: extraerNombresEmpleados(tarea.empleados_responsables),
      designado: extraerNombresEmpleados(tarea.empleados_designados),
      cliente: tarea.cliente?.nombre || "",
    });

    // Si no existe, crear nuevo evento
    if (response.status === 404) {
      await crearEventoCalendario({
        titulo: tarea.nombre,
        descripcion: tarea.descripcion,
        fechaInicio: fechaVencimiento,
        fechaFin: fechaFinEvento,
        taskId: tarea.id,
        esTodoElDia,
        responsable: extraerNombresEmpleados(tarea.empleados_responsables),
        designado: extraerNombresEmpleados(tarea.empleados_designados),
        cliente: tarea.cliente?.nombre || "",
      });
    }
  } catch (calError) {
    console.warn("⚠️ Error al actualizar evento en calendario:", calError);
  } finally {
    setTimeout(() => {
      calendarioEnProgreso.current.delete(calendarioKey);
    }, 1000);
  }
};

/**
 * Sincroniza la descripción/notas con Google Calendar
 */
export const sincronizarDescripcionConCalendario = async ({
  tarea,
  tareaActualizada,
  calendarioEnProgreso,
}) => {
  const calendarioKey = `desc-${tarea.id}`;
  if (calendarioEnProgreso.current.has(calendarioKey)) return;

  calendarioEnProgreso.current.add(calendarioKey);

  try {
    await actualizarEventoCalendario({
      taskId: tarea.id,
      descripcion: tareaActualizada.descripcion || "",
      notes: tareaActualizada.notas || "",
      responsable: extraerNombresEmpleados(
        tareaActualizada.empleados_responsables
      ),
      designado: extraerNombresEmpleados(tareaActualizada.empleados_designados),
      cliente: tareaActualizada.cliente?.nombre || "",
    });
  } catch (calError) {
    console.warn("⚠️ Error actualizando descripción en calendario:", calError);
  } finally {
    setTimeout(() => {
      calendarioEnProgreso.current.delete(calendarioKey);
    }, 1000);
  }
};

/**
 * Crea un evento de calendario para una nueva tarea
 */
export const crearEventoParaNuevaTarea = async ({
  tarea,
  tareaId,
  esTodoElDia,
  horaInicio,
  horaFin,
  empleadosResponsables,
  empleadosDesignados,
  clienteNombre,
}) => {
  if (!tarea.fecha_vencimiento) return null;
  if (!debeSincronizarConCalendario(tarea.nombre)) {
    return { sincronizado: false };
  }

  try {
    const { fechaVencimiento, fechaFin } = crearFechasEvento(
      tarea.fecha_vencimiento,
      esTodoElDia,
      horaInicio,
      horaFin
    );

    const responsableStr =
      empleadosResponsables
        ?.map((e) => e.nombre || e.apellido || e.nombre_completo || "")
        .filter(Boolean)
        .join(", ") || "";

    const designadoStr =
      empleadosDesignados
        ?.map((e) => e.nombre || e.apellido || e.nombre_completo || "")
        .filter(Boolean)
        .join(", ") || "";

    const response = await crearEventoCalendario({
      titulo: tarea.nombre,
      descripcion: tarea.descripcion,
      fechaInicio: fechaVencimiento,
      fechaFin: fechaFin,
      taskId: tareaId,
      esTodoElDia,
      responsable: responsableStr,
      designado: designadoStr,
      cliente: clienteNombre,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error al crear evento en calendario:", errorData);
      return { sincronizado: false, error: errorData.error };
    }

    return { sincronizado: true };
  } catch (calError) {
    console.error("❌ Error de red al crear evento:", calError);
    return { sincronizado: false, error: calError.message };
  }
};
