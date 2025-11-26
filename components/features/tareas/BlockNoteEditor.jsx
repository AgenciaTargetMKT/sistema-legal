"use client";

import { useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Loader2, Save, History, FileText } from "lucide-react";

export default function BlockNoteEditor({ tareaId, readOnly = false }) {
  const { empleado } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [notaId, setNotaId] = useState(null);

  // Función para subir archivos (imágenes)
  const uploadFile = async (file) => {
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${tareaId}_${Date.now()}.${fileExt}`;
      const filePath = `tareas/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from("archivos-tareas")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from("archivos-tareas")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast.error("Error al subir la imagen: " + error.message);
      throw error;
    }
  };

  // Crear el editor con configuración inicial
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "Escribe tus notas aquí...",
      },
    ],
    uploadFile, // Agregar soporte para subir archivos
  });

  // Cargar notas desde Supabase
  useEffect(() => {
    if (tareaId) {
      cargarNotas();
    }
  }, [tareaId]);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notas_tarea")
        .select("*")
        .eq("tarea_id", tareaId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setNotaId(data.id);
        // Cargar el contenido en el editor
        if (
          data.contenido &&
          Array.isArray(data.contenido) &&
          data.contenido.length > 0
        ) {
          editor.replaceBlocks(editor.document, data.contenido);
        }
        setLastSaved(new Date(data.updated_at));
      }
    } catch (error) {
      console.error("Error cargando notas:", error);
      toast.error("Error al cargar las notas");
    } finally {
      setLoading(false);
    }
  };

  const guardarNotas = async () => {
    if (!empleado || !tareaId) return;

    try {
      setSaving(true);
      const contenido = editor.document;

      // Verificar si ya existe una nota
      if (notaId) {
        // Actualizar nota existente
        const { error } = await supabase
          .from("notas_tarea")
          .update({
            contenido: contenido,
            empleado_modificado_id: empleado.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notaId);

        if (error) throw error;
      } else {
        // Crear nueva nota
        const { data, error } = await supabase
          .from("notas_tarea")
          .insert({
            tarea_id: tareaId,
            contenido: contenido,
            empleado_modificado_id: empleado.id,
          })
          .select()
          .single();

        if (error) throw error;
        setNotaId(data.id);
      }

      setLastSaved(new Date());
      toast.success("Notas guardadas correctamente");
    } catch (error) {
      console.error("Error guardando notas:", error);
      toast.error("Error al guardar las notas: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-guardar cada 5 segundos
  useEffect(() => {
    if (!readOnly && tareaId && empleado) {
      const interval = setInterval(() => {
        guardarNotas();
      }, 5000); // 5 segundos

      return () => clearInterval(interval);
    }
  }, [readOnly, tareaId, empleado, notaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando notas...</p>
        </div>
      </div>
    );
  }

  if (!tareaId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 font-medium">
          Guarda la tarea primero
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Las notas estarán disponibles después de guardar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de estado */}
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="h-3.5 w-3.5 text-green-600" />
                <span>Guardado {lastSaved.toLocaleTimeString("es-ES")}</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>Sin guardar</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor de BlockNote */}
      <div className="blocknote-editor-wrapper rounded-lg border border-gray-200 overflow-hidden">
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme="light"
          data-theming-css-variables-demo
        />
      </div>

      {/* Información adicional */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-xs text-blue-700">
          <History className="h-3.5 w-3.5" />
          <span>Los cambios se guardan automáticamente cada 5 segundos</span>
        </div>
      </div>
    </div>
  );
}
