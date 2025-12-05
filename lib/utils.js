import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Funciones de utilidad para fechas
export function formatearFecha(fecha, formato = "dd/MM/yyyy") {
  if (!fecha) return "";
  try {
    const fechaObj = typeof fecha === "string" ? parseISO(fecha) : fecha;
    return format(fechaObj, formato, { locale: es });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "";
  }
}

export function diasRestantes(fecha) {
  if (!fecha) return null;
  try {
    const fechaObj = typeof fecha === "string" ? parseISO(fecha) : fecha;
    return differenceInDays(fechaObj, new Date());
  } catch (error) {
    console.error("Error al calcular días restantes:", error);
    return null;
  }
}

export function estaVencido(fecha) {
  if (!fecha) return false;
  try {
    const fechaObj = typeof fecha === "string" ? parseISO(fecha) : fecha;
    return isPast(fechaObj);
  } catch (error) {
    console.error("Error al verificar vencimiento:", error);
    return false;
  }
}
