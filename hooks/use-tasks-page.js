"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTareas, useEmpleados, useEstadosTarea } from "@/hooks/use-tasks";

export default function useTareasPage() {
  const { empleado } = useAuth();
  const { data: tareas = [], isLoading: loading, refetch } = useTareas();
  const { data: empleados = [] } = useEmpleados();
  const { data: estadosTarea = [] } = useEstadosTarea();
  const [empleadoListo, setEmpleadoListo] = useState(false);

  useEffect(() => {
    if (empleado?.id) {
      setEmpleadoListo(true);
    }
  }, [empleado?.id]);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroImportancia, setFiltroImportancia] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState("mis-tareas");
  const [panelOpen, setPanelOpen] = useState(false);
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState(new Set());
  const [openEstado, setOpenEstado] = useState(false);

  // Sincronizar tarea seleccionada con datos actualizados
  useEffect(() => {
    if (!panelOpen || !tareaSeleccionada?.id) return;

    const tareaActualizada = tareas.find((t) => t.id === tareaSeleccionada.id);
    if (tareaActualizada) {
      const hayDiferencias =
        JSON.stringify(tareaActualizada) !== JSON.stringify(tareaSeleccionada);
      if (hayDiferencias) {
        setTareaSeleccionada(tareaActualizada);
      }
    }
  }, [tareas, panelOpen, tareaSeleccionada]);

  // Handlers
  const handleNuevaTarea = useCallback(() => {
    setTareaSeleccionada(null);
    setPanelOpen(true);
  }, []);

  const handleEditarTarea = useCallback((tarea) => {
    setTareaSeleccionada(tarea);
    setPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setTareaSeleccionada(null);
  }, []);

  const toggleEmpleado = useCallback((empleadoId) => {
    setEmpleadosExpandidos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empleadoId)) {
        newSet.delete(empleadoId);
      } else {
        newSet.add(empleadoId);
      }
      return newSet;
    });
  }, []);

  // Filtrado de tareas
  const tareasFiltradas = useMemo(() => {
    if (vistaActual === "mis-tareas" && !empleado?.id) {
      return [];
    }

    return tareas.filter((tarea) => {
      const esFinalizada = tarea.estado?.categoria === "completado";
      if (esFinalizada) return false;

      if (vistaActual === "mis-tareas") {
        const miId = empleado.id;

        const esResponsable =
          Array.isArray(tarea.empleados_responsables) &&
          tarea.empleados_responsables.length > 0 &&
          tarea.empleados_responsables.some((item) => {
            const empId = item?.empleado?.id || item?.empleado_id || item?.id;
            return empId === miId;
          });

        const esDesignado =
          Array.isArray(tarea.empleados_designados) &&
          tarea.empleados_designados.length > 0 &&
          tarea.empleados_designados.some((item) => {
            const empId = item?.empleado?.id || item?.empleado_id || item?.id;
            return empId === miId;
          });

        if (!esResponsable && !esDesignado) {
          return false;
        }
      }

      // Filtrar por vistas específicas
      if (vistaActual === "proximos-5-dias") {
        if (!tarea.fecha_vencimiento) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hace5Dias = new Date();
        hace5Dias.setDate(hace5Dias.getDate() - 5);
        hace5Dias.setHours(0, 0, 0, 0);
        const fechaVencimiento = new Date(tarea.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (!(fechaVencimiento >= hace5Dias && fechaVencimiento <= hoy))
          return false;
      }

      if (vistaActual === "retrasadas") {
        if (!tarea.fecha_vencimiento) return false;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaVencimiento = new Date(tarea.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (
          !(fechaVencimiento < hoy && tarea.estado?.categoria !== "completado")
        )
          return false;
      }

      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        tarea.nombre?.toLowerCase().includes(searchLower) ||
        tarea.proceso?.nombre?.toLowerCase().includes(searchLower) ||
        tarea.empleados_responsables?.some(
          (emp) =>
            emp.empleado?.nombre?.toLowerCase().includes(searchLower) ||
            emp.empleado?.apellido?.toLowerCase().includes(searchLower)
        );

      const matchEstado =
        filtroEstado === "todos" || tarea.estado_id === filtroEstado;
      const matchImportancia =
        filtroImportancia === "todos" ||
        tarea.importancia?.toLowerCase() === filtroImportancia.toLowerCase();
      const matchUrgencia =
        filtroUrgencia === "todos" ||
        tarea.urgencia?.toLowerCase() === filtroUrgencia.toLowerCase();

      return matchSearch && matchEstado && matchImportancia && matchUrgencia;
    });
  }, [
    tareas,
    vistaActual,
    empleado,
    searchTerm,
    filtroEstado,
    filtroImportancia,
    filtroUrgencia,
  ]);

  // Funciones helper
  const getTareasPorEmpleado = useCallback(
    (empleadoId) => {
      return tareasFiltradas.filter((tarea) => {
        const esResponsable = tarea.empleados_responsables?.some(
          (emp) =>
            emp.empleado?.id === empleadoId ||
            emp.empleado_id === empleadoId ||
            emp.id === empleadoId
        );

        const esDesignado = tarea.empleados_designados?.some(
          (emp) =>
            emp.empleado?.id === empleadoId ||
            emp.empleado_id === empleadoId ||
            emp.id === empleadoId
        );

        return esResponsable || esDesignado;
      });
    },
    [tareasFiltradas]
  );

  const getTareasSinAsignar = useCallback(() => {
    return tareasFiltradas.filter((tarea) => {
      const tieneResponsables =
        Array.isArray(tarea.empleados_responsables) &&
        tarea.empleados_responsables.length > 0;
      const tieneDesignados =
        Array.isArray(tarea.empleados_designados) &&
        tarea.empleados_designados.length > 0;

      return !tieneResponsables && !tieneDesignados;
    });
  }, [tareasFiltradas]);

  const getEmpleadosConTareas = useCallback(() => {
    return empleados
      .map((emp) => ({
        ...emp,
        cantidadTareas: getTareasPorEmpleado(emp.id).length,
      }))
      .filter((emp) => emp.cantidadTareas > 0);
  }, [empleados, getTareasPorEmpleado]);

  const mostrarFiltros = [
    "mis-tareas",
    "todas",
    "proximos-5-dias",
    "retrasadas",
  ].includes(vistaActual);

  return {
    // Datos
    tareas,
    tareasFiltradas,
    empleados,
    estadosTarea,
    empleado,
    loading,
    empleadoListo,

    // Estados de filtros
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado,
    filtroImportancia,
    setFiltroImportancia,
    filtroUrgencia,
    setFiltroUrgencia,

    // Estados de UI
    vistaActual,
    setVistaActual,
    panelOpen,
    setPanelOpen,
    tareaSeleccionada,
    setTareaSeleccionada,
    empleadosExpandidos,
    openEstado,
    setOpenEstado,
    mostrarFiltros,

    // Handlers
    handleNuevaTarea,
    handleEditarTarea,
    handleClosePanel,
    toggleEmpleado,
    refetch,

    // Funciones helper
    getTareasPorEmpleado,
    getTareasSinAsignar,
    getEmpleadosConTareas,
  };
}
