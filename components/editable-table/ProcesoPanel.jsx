"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ContentEditable from "react-contenteditable";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  X,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import TareaPanel from "./TareaPanel";

export default function ProcesoPanel({ proceso, isOpen, onClose, onUpdate }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [procesosEmpleados, setProcesosEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [tareaPanelOpen, setTareaPanelOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [procesoLocal, setProcesoLocal] = useState(proceso);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
  });

  // Catálogos para los dropdowns
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);
  const [rolesCliente, setRolesCliente] = useState([]);

  useEffect(() => {
    if (isOpen && proceso) {
      cargarDatos();
      cargarCatalogos();

      // Limpiar HTML de campos de texto
      const cleanHTML = (text) => {
        if (!text) return text;
        const temp = document.createElement("div");
        temp.innerHTML = text;
        return temp.textContent || temp.innerText || "";
      };

      const cleanedProceso = {
        ...proceso,
        dependencia: cleanHTML(proceso.dependencia),
        pretensiones: cleanHTML(proceso.pretensiones),
        ultima_actuacion_esperada: cleanHTML(proceso.ultima_actuacion_esperada),
      };

      setProcesoLocal(cleanedProceso);
    }
  }, [isOpen, proceso]);

  const cargarCatalogos = async () => {
    try {
      const [clientesRes, estadosRes, materiasRes, tiposRes, rolesRes] =
        await Promise.all([
          supabase.from("clientes").select("id, nombre").order("nombre"),
          supabase
            .from("estados_proceso")
            .select("id, nombre, color")
            .order("nombre"),
          supabase.from("materias").select("id, nombre").order("nombre"),
          supabase.from("tipos_proceso").select("id, nombre").order("nombre"),
          supabase.from("roles_cliente").select("id, nombre").order("nombre"),
        ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (materiasRes.data) setMaterias(materiasRes.data);
      if (tiposRes.data) setTiposProceso(tiposRes.data);
      if (rolesRes.data) setRolesCliente(rolesRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, es modo creación - actualizar localmente
      if (!proceso?.id) {
        console.log(
          "Modo creación - campo actualizado localmente:",
          campo,
          valor
        );

        // Actualizar el campo y buscar el objeto completo si es una relación
        const updates = { [campo]: valor };

        if (campo === "cliente_id" && valor) {
          const cliente = clientes.find((c) => c.id === valor);
          if (cliente) updates.cliente = cliente;
        } else if (campo === "rol_cliente_id" && valor) {
          const rol = rolesCliente.find((r) => r.id === valor);
          if (rol) updates.rol_cliente = rol;
        } else if (campo === "materia_id" && valor) {
          const materia = materias.find((m) => m.id === valor);
          if (materia) updates.materia = materia;
        } else if (campo === "estado_id" && valor) {
          const estado = estados.find((e) => e.id === valor);
          if (estado) updates.estado = estado;
        } else if (campo === "tipo_proceso_id" && valor) {
          const tipo = tiposProceso.find((t) => t.id === valor);
          if (tipo) updates.tipo_proceso = tipo;
        }

        setProcesoLocal((prev) => ({ ...prev, ...updates }));
        return;
      }

      // Actualizar proceso existente (modo edición)
      const { error } = await supabase
        .from("procesos")
        .update({ [campo]: valor })
        .eq("id", proceso.id);

      if (error) throw error;

      onUpdate?.();
    } catch (error) {
      console.error("Error actualizando:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const guardarNuevoProceso = async () => {
    try {
      if (!procesoLocal?.nombre) {
        toast.error("Por favor completa al menos el nombre del proceso");
        return;
      }

      const nuevoProceso = {
        nombre: procesoLocal.nombre,
        cliente_id: procesoLocal.cliente_id || null,
        rol_cliente_id: procesoLocal.rol_cliente_id || null,
        materia_id: procesoLocal.materia_id || null,
        estado_id: procesoLocal.estado_id || null,
        tipo_proceso_id: procesoLocal.tipo_proceso_id || null,
        contraparte: procesoLocal.contraparte || "",
        dependencia: procesoLocal.dependencia || "",
        pretensiones: procesoLocal.pretensiones || "",
        lugar: procesoLocal.lugar || "",
        ultima_actuacion_esperada: procesoLocal.ultima_actuacion_esperada || "",
        fecha_proximo_contacto: procesoLocal.fecha_proximo_contacto || null,
        impulso: procesoLocal.impulso || false,
      };

      const { data, error } = await supabase
        .from("procesos")
        .insert([nuevoProceso])
        .select()
        .single();

      if (error) throw error;

      toast.success("Proceso creado exitosamente");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Error creando proceso:", error);
      toast.error("Error al crear proceso: " + error.message);
    }
  };

  const cargarDatos = async () => {
    if (!proceso?.id) return;

    try {
      setLoading(true);

      // Cargar comentarios
      const { data: comentariosData } = await supabase
        .from("comentarios")
        .select(
          `
          *,
          empleado:empleados(nombre, apellido)
        `
        )
        .eq("proceso_id", proceso.id)
        .order("created_at", { ascending: false });

      // Cargar empleados del sistema
      const { data: empleadosData } = await supabase
        .from("empleados")
        .select("id, nombre, apellido")
        .eq("activo", true)
        .order("nombre");

      // Cargar empleados asignados a este proceso
      const { data: procesoEmpleadosData } = await supabase
        .from("proceso_empleados")
        .select(
          `
          *,
          empleado:empleados(id, nombre, apellido)
        `
        )
        .eq("proceso_id", proceso.id)
        .eq("activo", true);

      // Cargar tareas del proceso
      const { data: tareasData } = await supabase
        .from("tareas")
        .select(
          `
          *,
          estado:estado_id(id, nombre, color),
          empleado_asignado:empleado_asignado_id(id, nombre, apellido)
        `
        )
        .eq("proceso_id", proceso.id)
        .order("created_at", { ascending: false });

      if (comentariosData) setComentarios(comentariosData);
      if (empleadosData) setEmpleados(empleadosData);
      if (procesoEmpleadosData) setProcesosEmpleados(procesoEmpleadosData);
      if (tareasData) setTareas(tareasData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription para comentarios
  useEffect(() => {
    if (!proceso?.id) return;

    const channel = supabase
      .channel(`comentarios-${proceso.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comentarios",
          filter: `proceso_id=eq.${proceso.id}`,
        },
        async (payload) => {
          console.log("Cambio en comentarios:", payload);

          if (payload.eventType === "INSERT") {
            // Cargar el comentario completo con la relación de empleado
            const { data } = await supabase
              .from("comentarios")
              .select(
                `
                *,
                empleado:empleados(nombre, apellido)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setComentarios((prev) => [data, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            // Actualizar comentario existente
            setComentarios((prev) =>
              prev.map((c) =>
                c.id === payload.new.id ? { ...c, ...payload.new } : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            // Eliminar comentario
            setComentarios((prev) =>
              prev.filter((c) => c.id !== payload.old.id)
            );
          }

          // Actualizar la tabla principal
          onUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proceso?.id, onUpdate]);

  const agregarComentario = async () => {
    if (!nuevoComentario.trim() || !proceso?.id) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Buscar el empleado asociado al usuario
      const { data: empleadoData } = await supabase
        .from("empleados")
        .select("id")
        .eq("user_id", userData?.user?.id)
        .single();

      const { error } = await supabase.from("comentarios").insert({
        proceso_id: proceso.id,
        empleado_id: empleadoData?.id || null,
        contenido: nuevoComentario.trim(),
        tipo: "nota",
      });

      if (error) throw error;

      setNuevoComentario("");
      cargarDatos();
      onUpdate?.();
    } catch (error) {
      console.error("Error agregando comentario:", error);
      toast.error("Error al agregar comentario: " + error.message);
    }
  };

  const crearTarea = async () => {
    if (!nuevaTarea.titulo.trim() || !proceso?.id) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Buscar el empleado asociado al usuario
      const { data: empleadoData } = await supabase
        .from("empleados")
        .select("id")
        .eq("user_id", userData?.user?.id)
        .single();

      const { error } = await supabase.from("tareas").insert({
        proceso_id: proceso.id,
        empleado_id: empleadoData?.id || null,
        titulo: nuevaTarea.titulo.trim(),
        descripcion: nuevaTarea.descripcion.trim(),
        estado: "pendiente",
        prioridad: "media",
      });

      if (error) throw error;

      setNuevaTarea({ titulo: "", descripcion: "" });
      cargarDatos();
    } catch (error) {
      console.error("Error creando tarea:", error);
      toast.error("Error al crear tarea: " + error.message);
    }
  };

  // Realtime para tareas
  useEffect(() => {
    if (!proceso?.id) return;

    const channel = supabase
      .channel(`tareas-${proceso.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
          filter: `proceso_id=eq.${proceso.id}`,
        },
        async (payload) => {
          console.log("Cambio en tareas:", payload);

          if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("tareas")
              .select(
                `
                *,
                empleado:empleados(nombre, apellido)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setTareas((prev) => [data, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            setTareas((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? { ...t, ...payload.new } : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTareas((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proceso?.id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay con animación */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9998] transition-opacity backdrop-blur-[2px]"
            onClick={onClose}
            style={{ left: 0, top: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Panel con animación slide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[1200px] bg-white shadow-2xl z-[9999] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-8 py-5 flex items-center justify-between z-[10000]">
              <div className="flex-1">
                {!proceso?.id ? (
                  <input
                    type="text"
                    value={procesoLocal?.nombre || ""}
                    onChange={(e) => actualizarCampo("nombre", e.target.value)}
                    placeholder="Nombre del proceso..."
                    className="text-2xl font-semibold text-gray-900 bg-transparent border-b-2 border-primary-400 outline-none w-full focus:border-primary-600"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {procesoLocal?.nombre || "Proceso sin nombre"}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!proceso?.id && (
                  <button
                    onClick={guardarNuevoProceso}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Guardar Proceso
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Grid de 2 columnas */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-6">
                  {/* Información del Proceso */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Información del Proceso
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                      <EditableSelect
                        label="Cliente"
                        value={
                          procesoLocal?.cliente?.nombre ||
                          clientes.find(
                            (c) => c.id === procesoLocal?.cliente_id
                          )?.nombre ||
                          ""
                        }
                        options={clientes}
                        onUpdate={(id) => actualizarCampo("cliente_id", id)}
                      />
                      <EditableSelect
                        label="Rol del Cliente"
                        value={
                          procesoLocal?.rol_cliente?.nombre ||
                          rolesCliente.find(
                            (r) => r.id === procesoLocal?.rol_cliente_id
                          )?.nombre ||
                          ""
                        }
                        options={rolesCliente}
                        onUpdate={(id) => actualizarCampo("rol_cliente_id", id)}
                      />
                      <EditableSelect
                        label="Materia"
                        value={
                          procesoLocal?.materia?.nombre ||
                          materias.find(
                            (m) => m.id === procesoLocal?.materia_id
                          )?.nombre ||
                          ""
                        }
                        options={materias}
                        onUpdate={(id) => actualizarCampo("materia_id", id)}
                      />
                      <EditableSelect
                        label="Estado"
                        value={
                          procesoLocal?.estado?.nombre ||
                          estados.find((e) => e.id === procesoLocal?.estado_id)
                            ?.nombre ||
                          ""
                        }
                        options={estados}
                        onUpdate={(id) => actualizarCampo("estado_id", id)}
                        badge={true}
                        badgeColor={
                          procesoLocal?.estado?.color ||
                          estados.find((e) => e.id === procesoLocal?.estado_id)
                            ?.color
                        }
                      />
                      <EditableSelect
                        label="Tipo de Proceso"
                        value={
                          procesoLocal?.tipo_proceso?.nombre ||
                          tiposProceso.find(
                            (t) => t.id === procesoLocal?.tipo_proceso_id
                          )?.nombre ||
                          ""
                        }
                        options={tiposProceso}
                        onUpdate={(id) =>
                          actualizarCampo("tipo_proceso_id", id)
                        }
                      />

                      <EditableText
                        label="Dependencia"
                        value={procesoLocal?.dependencia}
                        onUpdate={(value) =>
                          actualizarCampo("dependencia", value)
                        }
                      />
                    </div>
                  </section>

                  {/* Pretensiones y Detalles */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Detalles del Proceso
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                      <EditableText
                        label="Pretensiones"
                        value={procesoLocal?.pretensiones}
                        onUpdate={(value) =>
                          actualizarCampo("pretensiones", value)
                        }
                        multiline={true}
                      />
                      <EditableText
                        label="Última Actuación Esperada"
                        value={procesoLocal?.ultima_actuacion_esperada}
                        onUpdate={(value) =>
                          actualizarCampo("ultima_actuacion_esperada", value)
                        }
                        multiline={true}
                      />
                      <EditableText
                        label="Lugar"
                        value={procesoLocal?.lugar}
                        onUpdate={(value) => actualizarCampo("lugar", value)}
                      />
                    </div>
                  </section>

                  {/* Fechas */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fechas
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                      <EditableDate
                        label="Próximo Contacto"
                        value={procesoLocal?.fecha_proximo_contacto}
                        onUpdate={(value) =>
                          actualizarCampo("fecha_proximo_contacto", value)
                        }
                      />
                    </div>
                  </section>

                  {/* Empleados Asignados */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Empleados Asignados ({procesosEmpleados.length})
                      </h3>
                    </div>

                    {/* Selector para agregar empleado */}
                    {proceso?.id && (
                      <div className="mb-3">
                        <EditableSelect
                          label="Agregar Empleado"
                          value=""
                          options={empleados
                            .filter(
                              (emp) =>
                                !procesosEmpleados.some(
                                  (pe) => pe.empleado_id === emp.id
                                )
                            )
                            .map((e) => ({
                              id: e.id,
                              nombre: `${e.nombre} ${e.apellido}`,
                            }))}
                          onUpdate={async (empleadoId) => {
                            if (!empleadoId) return;
                            try {
                              const { error } = await supabase
                                .from("proceso_empleados")
                                .insert({
                                  proceso_id: proceso.id,
                                  empleado_id: empleadoId,
                                  rol: "Colaborador",
                                  activo: true,
                                });
                              if (error) throw error;
                              cargarDatos();
                            } catch (error) {
                              console.error("Error asignando empleado:", error);
                              toast.error(
                                "Error al asignar empleado: " + error.message
                              );
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {procesosEmpleados.map((pe) => (
                        <div
                          key={pe.id}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {pe.empleado?.nombre} {pe.empleado?.apellido}
                            </p>
                            {pe.rol && (
                              <p className="text-xs text-gray-500 mt-1">
                                {pe.rol}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatearFecha(pe.fecha_asignacion)}
                            </span>
                            {proceso?.id && (
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "¿Remover este empleado del proceso?"
                                    )
                                  )
                                    return;
                                  try {
                                    const { error } = await supabase
                                      .from("proceso_empleados")
                                      .delete()
                                      .eq("id", pe.id);
                                    if (error) throw error;
                                    cargarDatos();
                                  } catch (error) {
                                    console.error(
                                      "Error removiendo empleado:",
                                      error
                                    );
                                    toast.error("Error al remover empleado");
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {procesosEmpleados.length === 0 && (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <p className="text-sm text-gray-400">
                            No hay empleados asignados
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Sección de Tareas */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tareas ({tareas.length})
                      </h3>
                      <button
                        onClick={() => {
                          setTareaSeleccionada({
                            proceso_id: proceso.id,
                            nombre: "",
                          });
                          setTareaPanelOpen(true);
                        }}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Nueva Tarea
                      </button>
                    </div>

                    {/* Lista de tareas */}
                    <AnimatePresence mode="popLayout">
                      {tareas.length > 0 ? (
                        <div className="space-y-2">
                          {tareas.map((tarea) => (
                            <motion.div
                              key={tarea.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-primary-200"
                              onClick={() => {
                                setTareaSeleccionada(tarea);
                                setTareaPanelOpen(true);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {tarea.estado?.nombre === "completada" ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={clsx(
                                      "text-sm font-medium",
                                      tarea.estado?.nombre === "completada"
                                        ? "text-gray-400 line-through"
                                        : "text-gray-900"
                                    )}
                                  >
                                    {tarea.nombre}
                                  </p>
                                  {tarea.descripcion && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      {tarea.descripcion}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    {tarea.estado && (
                                      <span
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                        style={{
                                          backgroundColor: `${tarea.estado.color}20`,
                                          color: tarea.estado.color,
                                        }}
                                      >
                                        {tarea.estado.nombre}
                                      </span>
                                    )}
                                    {tarea.prioridad && (
                                      <span
                                        className={clsx(
                                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                          tarea.prioridad === "alta"
                                            ? "bg-red-100 text-red-700"
                                            : tarea.prioridad === "media"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                        )}
                                      >
                                        {tarea.prioridad}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-gray-50 rounded-lg p-8 text-center"
                        >
                          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">
                            No hay tareas en este proceso
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Haz clic en "Nueva Tarea" para empezar
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                </div>

                {/* Columna Derecha - Comentarios */}
                <div className="space-y-6">
                  <section className="h-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comentarios ({comentarios.length})
                    </h3>

                    {/* Input para nuevo comentario */}
                    <div className="mb-6">
                      <div className="flex gap-2">
                        <Input
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          placeholder="Agregar un comentario..."
                          className="flex-1 h-12"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              agregarComentario();
                            }
                          }}
                        />
                        <Button
                          onClick={agregarComentario}
                          disabled={!nuevoComentario.trim()}
                          className="h-12 px-6"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Enviar
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Presiona Enter para enviar
                      </p>
                    </div>

                    {/* Lista de comentarios - Scroll independiente */}
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[calc(100vh-300px)]">
                      {comentarios.map((comentario) => (
                        <div
                          key={comentario.id}
                          className="bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatearFecha(comentario.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                            {comentario.contenido}
                          </p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {comentario.empleado?.nombre}{" "}
                            {comentario.empleado?.apellido || "Usuario"}
                          </p>
                        </div>
                      ))}
                      {comentarios.length === 0 && (
                        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-200">
                          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-400 font-medium">
                            No hay comentarios aún
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Sé el primero en comentar
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TareaPanel integrado */}
      <TareaPanel
        tarea={tareaSeleccionada}
        isOpen={tareaPanelOpen}
        onClose={() => {
          setTareaPanelOpen(false);
          setTareaSeleccionada(null);
          cargarDatos(); // Recargar tareas cuando se cierre el panel
        }}
        onUpdate={cargarDatos}
      />
    </>
  );

  // Componente de texto editable
  function EditableText({ label, value, onUpdate, multiline = false }) {
    const [editing, setEditing] = useState(false);

    // Limpiar HTML tags del valor inicial
    const cleanValue = (val) => {
      if (!val) return "";
      // Eliminar tags HTML pero mantener el contenido
      const temp = document.createElement("div");
      temp.innerHTML = val;
      return temp.textContent || temp.innerText || "";
    };

    const [currentValue, setCurrentValue] = useState(cleanValue(value));
    const contentRef = useRef();

    useEffect(() => {
      setCurrentValue(cleanValue(value));
    }, [value]);

    useEffect(() => {
      if (editing && contentRef.current) {
        contentRef.current.focus();

        const handleKeyDown = (e) => {
          if (e.key === "Enter" && !e.shiftKey && !multiline) {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setCurrentValue(value || "");
            setEditing(false);
          }
        };

        contentRef.current.addEventListener("keydown", handleKeyDown);
        return () => {
          contentRef.current?.removeEventListener("keydown", handleKeyDown);
        };
      }
    }, [editing, value, multiline]);

    const handleSave = () => {
      setEditing(false);
      const cleanedValue = cleanValue(currentValue);
      if (cleanedValue !== cleanValue(value)) {
        onUpdate(cleanedValue);
      }
    };

    return (
      <div
        className={clsx(
          "flex justify-between",
          multiline ? "flex-col gap-2" : "items-center"
        )}
      >
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div
          className={clsx(
            "px-3 py-2 rounded text-sm transition-all cursor-text flex-1",
            multiline ? "min-h-20" : "min-h-8",
            editing
              ? "bg-blue-50 ring-2 ring-blue-400"
              : "bg-white hover:bg-gray-50 border border-gray-200"
          )}
          onClick={() => !editing && setEditing(true)}
        >
          {editing ? (
            <ContentEditable
              innerRef={contentRef}
              html={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onBlur={handleSave}
              className="outline-none w-full"
              style={{ caretColor: "#2563eb" }}
            />
          ) : (
            <div className="text-gray-900">
              {currentValue || (
                <span className="text-gray-400">Click para editar...</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Componente de select editable
  function EditableSelect({
    label,
    value,
    options,
    onUpdate,
    badge = false,
    badgeColor,
  }) {
    const [isOpen, setIsOpen] = useState(false);
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
      placement: "bottom-start",
      strategy: "fixed",
    });

    const handleSelect = (option) => {
      onUpdate(option.id);
      setIsOpen(false);
    };

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (
          popperElement &&
          !popperElement.contains(e.target) &&
          referenceElement &&
          !referenceElement.contains(e.target)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen, popperElement, referenceElement]);

    return (
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div
          ref={setReferenceElement}
          className={clsx(
            "px-3 py-2 rounded-lg text-sm cursor-pointer transition-all flex-1 ml-4",
            isOpen
              ? "bg-blue-50 ring-2 ring-blue-400"
              : "bg-white hover:bg-gray-50 border border-gray-200"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {value ? (
            badge ? (
              <span
                className="inline-block px-2 py-1 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: badgeColor ? `${badgeColor}20` : "#f3f4f6",
                  color: badgeColor || "#374151",
                }}
              >
                {value}
              </span>
            ) : (
              <span className="text-gray-900">{value}</span>
            )
          ) : (
            <span className="text-gray-400">Seleccionar...</span>
          )}
        </div>

        {isOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className="z-[11000] bg-white border-2 border-blue-400 shadow-xl rounded-lg py-1 min-w-[250px] max-h-[300px] overflow-auto"
            >
              {options.map((option) => (
                <div
                  key={option.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  {option.nombre}
                </div>
              ))}
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No hay opciones
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }

  // Componente de fecha editable
  function EditableDate({ label, value, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef();

    const formatearFecha = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toISOString().slice(0, 16);
    };

    const formatearFechaDisplay = (fecha) => {
      if (!fecha) return "Sin fecha";
      return new Date(fecha).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const handleSave = (e) => {
      const newValue = e.target.value;
      setEditing(false);
      if (newValue && newValue !== formatearFecha(value)) {
        onUpdate(new Date(newValue).toISOString());
      }
    };

    return (
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="datetime-local"
            defaultValue={formatearFecha(value)}
            onBlur={handleSave}
            onChange={handleSave}
            autoFocus
            className="px-3 py-2 rounded text-sm bg-blue-50 ring-2 ring-blue-400 outline-none flex-1 ml-4"
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="px-3 py-2 rounded text-sm bg-white hover:bg-gray-50 border border-gray-200 cursor-pointer transition-all flex-1 ml-4"
          >
            <span className="text-gray-900">
              {formatearFechaDisplay(value)}
            </span>
          </div>
        )}
      </div>
    );
  }
}
