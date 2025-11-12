"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ContentEditable from "react-contenteditable";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import {
  X,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Plus,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "clsx";

export default function ProcesoPanel({ proceso, isOpen, onClose, onUpdate }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [procesosEmpleados, setProcesosEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
  });

  // Catálogos para los dropdowns
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tiposProceso, setTiposProceso] = useState([]);

  useEffect(() => {
    if (isOpen && proceso) {
      cargarDatos();
      cargarCatalogos();
    }
  }, [isOpen, proceso]);

  const cargarCatalogos = async () => {
    try {
      const [clientesRes, estadosRes, materiasRes, tiposRes] =
        await Promise.all([
          supabase.from("clientes").select("id, nombre").order("nombre"),
          supabase
            .from("estados_proceso")
            .select("id, nombre, color")
            .order("nombre"),
          supabase.from("materias").select("id, nombre").order("nombre"),
          supabase.from("tipos_proceso").select("id, nombre").order("nombre"),
        ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (materiasRes.data) setMaterias(materiasRes.data);
      if (tiposRes.data) setTiposProceso(tiposRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  const actualizarCampo = async (campo, valor) => {
    try {
      // Si no hay ID, crear nuevo proceso
      if (!proceso?.id) {
        const nuevoProceso = {
          numero_proceso: proceso.numero_proceso || "",
          nombre: proceso.nombre || "Nuevo Proceso",
          descripcion: proceso.descripcion || "",
          cliente_id: proceso.cliente_id,
          materia_id: proceso.materia_id,
          estado_id: proceso.estado_id,
          tipo_proceso_id: proceso.tipo_proceso_id,
          fecha_inicio: proceso.fecha_inicio || new Date().toISOString().split("T")[0],
          monto_demanda: proceso.monto_demanda,
          observaciones: proceso.observaciones || "",
          [campo]: valor, // Actualizar el campo que se está editando
        };

        const { data, error } = await supabase
          .from("procesos")
          .insert([nuevoProceso])
          .select()
          .single();

        if (error) throw error;

        // Actualizar el proceso con el nuevo ID
        proceso.id = data.id;
        onUpdate?.();
        return;
      }

      // Actualizar proceso existente
      const { error } = await supabase
        .from("procesos")
        .update({ [campo]: valor })
        .eq("id", proceso.id);

      if (error) throw error;

      onUpdate?.();
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Error al actualizar: " + error.message);
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
          empleado:empleados(nombre, apellido)
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
      alert("Error al agregar comentario: " + error.message);
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
      alert("Error al crear tarea: " + error.message);
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
      {/* Overlay que cubre TODO incluyendo el sidebar */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998] transition-opacity backdrop-blur-[2px]"
        onClick={onClose}
        style={{ left: 0, top: 0 }}
      />

      {/* Panel - Más ancho y con grid de 2 columnas */}
      <div className="fixed right-0 top-0 h-full w-[1200px] bg-white shadow-2xl z-[9999] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-8 py-5 flex items-center justify-between z-[10000]">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {proceso?.nombre || "Proceso"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {proceso?.numero_proceso}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                    value={proceso?.cliente?.nombre}
                    options={clientes}
                    onUpdate={(id) => actualizarCampo("cliente_id", id)}
                  />
                  <EditableSelect
                    label="Materia"
                    value={proceso?.materia?.nombre}
                    options={materias}
                    onUpdate={(id) => actualizarCampo("materia_id", id)}
                  />
                  <EditableSelect
                    label="Estado"
                    value={proceso?.estado?.nombre}
                    options={estados}
                    onUpdate={(id) => actualizarCampo("estado_id", id)}
                    badge={true}
                    badgeColor={proceso?.estado?.color}
                  />
                  <EditableSelect
                    label="Tipo de Proceso"
                    value={proceso?.tipo_proceso?.nombre}
                    options={tiposProceso}
                    onUpdate={(id) => actualizarCampo("tipo_proceso_id", id)}
                  />
                  <EditableText
                    label="ROL Cliente"
                    value={proceso?.contra_parte}
                    onUpdate={(value) => actualizarCampo("contra_parte", value)}
                  />
                  <EditableText
                    label="Dependencia"
                    value={proceso?.dependencia}
                    onUpdate={(value) => actualizarCampo("dependencia", value)}
                  />
                </div>
              </section>

              {/* Pretensiones y Observaciones */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Detalles
                </h3>
                <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                  <EditableText
                    label="Pretensiones"
                    value={proceso?.pretensiones}
                    onUpdate={(value) => actualizarCampo("pretensiones", value)}
                    multiline={true}
                  />
                  <EditableText
                    label="Observaciones"
                    value={proceso?.observaciones}
                    onUpdate={(value) =>
                      actualizarCampo("observaciones", value)
                    }
                    multiline={true}
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
                    label="Fecha de Inicio"
                    value={proceso?.fecha_inicio}
                    onUpdate={(value) => actualizarCampo("fecha_inicio", value)}
                  />
                  <EditableDate
                    label="Fecha de Conclusión"
                    value={proceso?.fecha_conclusion}
                    onUpdate={(value) =>
                      actualizarCampo("fecha_conclusion", value)
                    }
                  />
                  <EditableDate
                    label="Próximo Contacto"
                    value={proceso?.fecha_proximo_contacto}
                    onUpdate={(value) =>
                      actualizarCampo("fecha_proximo_contacto", value)
                    }
                  />
                  <EditableDate
                    label="Recordatorio"
                    value={proceso?.fecha_recordatorio}
                    onUpdate={(value) =>
                      actualizarCampo("fecha_recordatorio", value)
                    }
                  />
                </div>
              </section>

              {/* Empleados Asignados */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Empleados Asignados ({procesosEmpleados.length})
                </h3>
                <div className="space-y-2">
                  {procesosEmpleados.map((pe) => (
                    <div
                      key={pe.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pe.empleado?.nombre} {pe.empleado?.apellido}
                        </p>
                        {pe.rol && (
                          <p className="text-xs text-gray-500 mt-1">{pe.rol}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatearFecha(pe.fecha_asignacion)}
                      </span>
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
                </div>

                {/* Formulario nueva tarea */}
                <div className="mb-4 space-y-2 bg-blue-50 p-3 rounded-lg">
                  <input
                    type="text"
                    placeholder="Título de la tarea..."
                    value={nuevaTarea.titulo}
                    onChange={(e) =>
                      setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        nuevaTarea.titulo.trim()
                      ) {
                        e.preventDefault();
                        crearTarea();
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                  />
                  <textarea
                    placeholder="Descripción (opcional)..."
                    value={nuevaTarea.descripcion}
                    onChange={(e) =>
                      setNuevaTarea({
                        ...nuevaTarea,
                        descripcion: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white"
                  />
                  <button
                    onClick={crearTarea}
                    disabled={!nuevaTarea.titulo.trim()}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Tarea
                  </button>
                </div>

                {/* Tabla de tareas */}
                <div className="border rounded-lg overflow-hidden">
                  {tareas.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Título
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Estado
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Asignado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tareas.map((tarea) => (
                          <tr key={tarea.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900">
                                {tarea.titulo}
                              </p>
                              {tarea.descripcion && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {tarea.descripcion}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tarea.estado === "completada"
                                    ? "bg-green-100 text-green-800"
                                    : tarea.estado === "en_progreso"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {tarea.estado === "completada"
                                  ? "✓"
                                  : tarea.estado === "en_progreso"
                                  ? "●"
                                  : "○"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {tarea.empleado?.nombre}{" "}
                              {tarea.empleado?.apellido}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="bg-gray-50 p-6 text-center">
                      <p className="text-sm text-gray-400">No hay tareas</p>
                    </div>
                  )}
                </div>
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
      </div>
    </>
  );
// Componente de texto editable
function EditableText({ label, value, onUpdate, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");
  const contentRef = useRef();

  useEffect(() => {
    setCurrentValue(value || "");
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
    if (currentValue !== value) {
      onUpdate(currentValue.trim());
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
          "px-3 py-2 rounded text-sm cursor-pointer transition-all flex-1 ml-4",
          isOpen
            ? "bg-blue-50 ring-2 ring-blue-400"
            : "bg-white hover:bg-gray-50 border border-gray-200"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          badge ? (
            <span
              className="inline-block px-2 py-1 rounded text-xs font-medium"
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
            className="z-[10001] bg-white border-2 border-blue-400 shadow-xl rounded-lg py-1 min-w-[250px] max-h-[300px] overflow-auto"
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
          <span className="text-gray-900">{formatearFechaDisplay(value)}</span>
        </div>
      )}
    </div>
  );
}
}
