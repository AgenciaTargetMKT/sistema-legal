"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Trash2,
  Image as ImageIcon,
  Upload,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

export default function NotionEditor({ tareaId, readOnly = false }) {
  const { empleado } = useAuth();
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (tareaId) {
      cargarBloques();
    }
  }, [tareaId]);

  const cargarBloques = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notas_bloques")
        .select(
          `
          *,
          empleado:empleados(id, nombre, apellido)
        `
        )
        .eq("tarea_id", tareaId)
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) throw error;
      setBloques(data || []);
    } catch (error) {
      console.error("Error cargando notas:", error);
      toast.error("Error al cargar las notas");
    } finally {
      setLoading(false);
    }
  };

  const crearBloque = async (tipo, contenido = {}) => {
    if (!empleado) return;

    try {
      const nuevoOrden =
        bloques.length > 0 ? Math.max(...bloques.map((b) => b.orden)) + 1 : 0;

      const { data, error } = await supabase
        .from("notas_bloques")
        .insert({
          tarea_id: tareaId,
          tipo,
          contenido,
          orden: nuevoOrden,
          empleado_id: empleado.id,
        })
        .select(
          `
          *,
          empleado:empleados(id, nombre, apellido)
        `
        )
        .single();

      if (error) throw error;

      setBloques([...bloques, data]);
      toast.success("Bloque agregado");
    } catch (error) {
      console.error("Error creando bloque:", error);
      toast.error("Error al crear el bloque");
    }
  };

  const actualizarBloque = async (bloqueId, nuevoContenido) => {
    if (!empleado) return;

    try {
      const { error } = await supabase
        .from("notas_bloques")
        .update({
          contenido: nuevoContenido,
          empleado_id: empleado.id,
        })
        .eq("id", bloqueId);

      if (error) throw error;

      setBloques(
        bloques.map((b) =>
          b.id === bloqueId
            ? { ...b, contenido: nuevoContenido, empleado: empleado }
            : b
        )
      );
    } catch (error) {
      console.error("Error actualizando bloque:", error);
      toast.error("Error al actualizar el bloque");
    }
  };

  const eliminarBloque = async (bloqueId) => {
    try {
      const { error } = await supabase
        .from("notas_bloques")
        .update({ activo: false })
        .eq("id", bloqueId);

      if (error) throw error;

      setBloques(bloques.filter((b) => b.id !== bloqueId));
      toast.success("Bloque eliminado");
    } catch (error) {
      console.error("Error eliminando bloque:", error);
      toast.error("Error al eliminar el bloque");
    }
  };

  const subirImagen = async (file, bloqueId = null) => {
    if (!file || !empleado) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${tareaId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("notas-imagenes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("notas-imagenes").getPublicUrl(fileName);

      const contenido = {
        url: publicUrl,
        fileName: file.name,
        size: file.size,
        uploadedBy: `${empleado.nombre} ${empleado.apellido}`,
        uploadedAt: new Date().toISOString(),
      };

      if (bloqueId) {
        await actualizarBloque(bloqueId, contenido);
      } else {
        await crearBloque("image", contenido);
      }

      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      toast.error("Error al subir la imagen");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      subirImagen(file, currentBlockId);
      setShowBlockMenu(false);
    }
  };

  const openBlockMenu = (e, blockId = null) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 5, left: rect.left });
    setCurrentBlockId(blockId);
    setShowBlockMenu(true);
  };

  const BlockMenu = () => (
    <AnimatePresence>
      {showBlockMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowBlockMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-64"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="space-y-1">
              <button
                onClick={() => {
                  crearBloque("text", { text: "", style: {} });
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <Type className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Texto</div>
                  <div className="text-xs text-gray-500">
                    Párrafo de texto simple
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  crearBloque("heading1", { text: "", style: {} });
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <Type className="h-5 w-5 text-gray-600 font-bold" />
                <div>
                  <div className="text-sm font-medium">Encabezado 1</div>
                  <div className="text-xs text-gray-500">Título grande</div>
                </div>
              </button>

              <button
                onClick={() => {
                  crearBloque("list", { items: [""], style: "bullet" });
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <List className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Lista</div>
                  <div className="text-xs text-gray-500">Lista con viñetas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  crearBloque("checklist", {
                    items: [{ text: "", checked: false }],
                  });
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <CheckSquare className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Lista de tareas</div>
                  <div className="text-xs text-gray-500">Con checkboxes</div>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <ImageIcon className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Imagen</div>
                  <div className="text-xs text-gray-500">Subir una imagen</div>
                </div>
              </button>

              <button
                onClick={() => {
                  crearBloque("quote", { text: "" });
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <Quote className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Cita</div>
                  <div className="text-xs text-gray-500">Resaltar texto</div>
                </div>
              </button>

              <button
                onClick={() => {
                  crearBloque("divider", {});
                  setShowBlockMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <Minus className="h-4 w-4 text-gray-600" />
                <div>
                  <div className="text-sm font-medium">Separador</div>
                  <div className="text-xs text-gray-500">Línea divisoria</div>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderBloque = (bloque) => {
    const contenido = bloque.contenido || {};

    switch (bloque.tipo) {
      case "text":
        return (
          <textarea
            value={contenido.text || ""}
            onChange={(e) =>
              actualizarBloque(bloque.id, {
                ...contenido,
                text: e.target.value,
              })
            }
            placeholder="Escribe algo..."
            disabled={readOnly}
            className="w-full min-h-[80px] p-3 border-0 focus:outline-none focus:ring-0 resize-none text-gray-700"
          />
        );

      case "heading1":
        return (
          <input
            type="text"
            value={contenido.text || ""}
            onChange={(e) =>
              actualizarBloque(bloque.id, {
                ...contenido,
                text: e.target.value,
              })
            }
            placeholder="Encabezado 1"
            disabled={readOnly}
            className="w-full text-2xl font-bold p-3 border-0 focus:outline-none focus:ring-0"
          />
        );

      case "heading2":
        return (
          <input
            type="text"
            value={contenido.text || ""}
            onChange={(e) =>
              actualizarBloque(bloque.id, {
                ...contenido,
                text: e.target.value,
              })
            }
            placeholder="Encabezado 2"
            disabled={readOnly}
            className="w-full text-xl font-semibold p-3 border-0 focus:outline-none focus:ring-0"
          />
        );

      case "list":
        return (
          <div className="p-3 space-y-2">
            {(contenido.items || [""]).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-2">•</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...(contenido.items || [""])];
                    newItems[idx] = e.target.value;
                    actualizarBloque(bloque.id, {
                      ...contenido,
                      items: newItems,
                    });
                  }}
                  placeholder="Elemento de lista"
                  disabled={readOnly}
                  className="flex-1 border-0 focus:outline-none focus:ring-0"
                />
              </div>
            ))}
          </div>
        );

      case "checklist":
        return (
          <div className="p-3 space-y-2">
            {(contenido.items || [{ text: "", checked: false }]).map(
              (item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={(e) => {
                      const newItems = [
                        ...(contenido.items || [{ text: "", checked: false }]),
                      ];
                      newItems[idx].checked = e.target.checked;
                      actualizarBloque(bloque.id, {
                        ...contenido,
                        items: newItems,
                      });
                    }}
                    disabled={readOnly}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <input
                    type="text"
                    value={item.text || ""}
                    onChange={(e) => {
                      const newItems = [
                        ...(contenido.items || [{ text: "", checked: false }]),
                      ];
                      newItems[idx].text = e.target.value;
                      actualizarBloque(bloque.id, {
                        ...contenido,
                        items: newItems,
                      });
                    }}
                    placeholder="Tarea"
                    disabled={readOnly}
                    className="flex-1 border-0 focus:outline-none focus:ring-0"
                  />
                </div>
              )
            )}
          </div>
        );

      case "image":
        return (
          <div className="p-3">
            {contenido.url ? (
              <div className="space-y-2">
                <img
                  src={contenido.url}
                  alt={contenido.fileName || "Imagen"}
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{contenido.uploadedBy}</span>
                  <Clock className="h-3 w-3 ml-2" />
                  <span>
                    {new Date(contenido.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Imagen en proceso de carga...
                </p>
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="border-l-4 border-primary-500 bg-primary-50 p-3">
            <textarea
              value={contenido.text || ""}
              onChange={(e) =>
                actualizarBloque(bloque.id, {
                  ...contenido,
                  text: e.target.value,
                })
              }
              placeholder="Escribe una cita..."
              disabled={readOnly}
              className="w-full min-h-[60px] bg-transparent border-0 focus:outline-none focus:ring-0 resize-none italic text-gray-700"
            />
          </div>
        );

      case "divider":
        return <hr className="my-4 border-gray-300" />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <BlockMenu />

      {bloques.map((bloque) => (
        <motion.div
          key={bloque.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative bg-white hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
        >
          <div className="flex items-start gap-2">
            {!readOnly && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-3">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}
            <div className="flex-1">{renderBloque(bloque)}</div>
            {!readOnly && (
              <button
                onClick={() => eliminarBloque(bloque.id)}
                className="p-2 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity mt-2"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            )}
          </div>

          {/* Info del autor */}
          <div className="px-3 pb-2 text-xs text-gray-400 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <User className="h-3 w-3" />
            <span>
              {bloque.empleado?.nombre} {bloque.empleado?.apellido}
            </span>
            <Clock className="h-3 w-3 ml-2" />
            <span>{new Date(bloque.updated_at).toLocaleString()}</span>
          </div>
        </motion.div>
      ))}

      {!readOnly && (
        <button
          onClick={openBlockMenu}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Agregar bloque</span>
        </button>
      )}

      {bloques.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3" />
          <p className="text-sm">
            {readOnly
              ? "No hay notas disponibles"
              : "Haz clic en 'Agregar bloque' para comenzar"}
          </p>
        </div>
      )}
    </div>
  );
}
