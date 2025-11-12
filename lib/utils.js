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

// Funciones de validación
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarDNI(dni) {
  const regex = /^\d{8}$/;
  return regex.test(dni);
}

export function validarRUC(ruc) {
  const regex = /^\d{11}$/;
  return regex.test(ruc);
}

// Función para formatear moneda
export function formatearMoneda(cantidad, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda,
  }).format(cantidad);
}

// Función para capitalizar texto
export function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Función para truncar texto
export function truncar(texto, maxLength = 50) {
  if (!texto) return "";
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + "...";
}
