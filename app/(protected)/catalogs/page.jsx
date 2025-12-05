"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Scale,
  Tag,
  Briefcase,
  UserCircle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const CATALOGOS = [
  {
    id: "estados_tarea",
    nombre: "Estados de Tarea",
    icon: Check,
    tabla: "estados_tarea",
    color: "#3B82F6",
    campos: ["nombre", "descripcion", "categoria", "color", "orden"],
  },
  {
    id: "estados_proceso",
    nombre: "Estados de Proceso",
    icon: Scale,
    tabla: "estados_proceso",
    color: "#8B5CF6",
    campos: ["nombre", "descripcion", "categoria", "color", "orden"],
  },
  {
    id: "materias",
    nombre: "Materias",
    icon: FileText,
    tabla: "materias",
    color: "#10B981",
    campos: ["nombre", "descripcion", "color"],
  },
  {
    id: "roles_cliente",
    nombre: "Roles de Cliente",
    icon: UserCircle,
    tabla: "roles_cliente",
    color: "#F59E0B",
    campos: ["nombre", "descripcion", "color"],
  },
  {
    id: "tipos_proceso",
    nombre: "Tipos de Proceso",
    icon: Briefcase,
    tabla: "tipos_proceso",
    color: "#EF4444",
    campos: ["nombre", "descripcion", "color"],
  },
];

export default function CatalogosPage() {
  const [catalogoActual, setCatalogoActual] = useState(CATALOGOS[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nuevoItem, setNuevoItem] = useState(null);

  useEffect(() => {
    cargarItems();
  }, [catalogoActual]);

  const cargarItems = async () => {
    setLoading(true);
    try {
      // Verificar si la tabla tiene columna orden
      const tieneOrden = catalogoActual.campos.includes("orden");

      let query = supabase.from(catalogoActual.tabla).select("*");

      if (tieneOrden) {
        query = query.order("orden", { ascending: true, nullsFirst: false });
      }
      query = query.order("nombre", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error al cargar items:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const iniciarNuevo = () => {
    const nuevoObj = {
      nombre: "",
      descripcion: "",
      color: "#6B7280",
      categoria: "",
      orden: items.length + 1,
      activo: true,
    };
    setNuevoItem(nuevoObj);
  };

  const cancelarNuevo = () => {
    setNuevoItem(null);
  };

  const guardarNuevo = async () => {
    if (!nuevoItem.nombre?.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      const { data, error } = await supabase
        .from(catalogoActual.tabla)
        .insert([nuevoItem])
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      setNuevoItem(null);
      toast.success("Creado correctamente");
    } catch (error) {
      console.error("Error al crear:", error);
      toast.error("Error al crear: " + error.message);
    }
  };

  const iniciarEdicion = (item) => {
    setEditando({ ...item });
  };

  const cancelarEdicion = () => {
    setEditando(null);
  };

  const guardarEdicion = async () => {
    if (!editando.nombre?.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      const { data, error } = await supabase
        .from(catalogoActual.tabla)
        .update(editando)
        .eq("id", editando.id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map((item) => (item.id === data.id ? data : item)));
      setEditando(null);
      toast.success("Actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const eliminarItem = async (item) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;

    try {
      const { error } = await supabase
        .from(catalogoActual.tabla)
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setItems(items.filter((i) => i.id !== item.id));
      toast.success("Eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Catálogos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los catálogos del sistema
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de Catálogo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catálogos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {CATALOGOS.map((catalogo) => {
                const Icon = catalogo.icon;
                const isActive = catalogoActual.id === catalogo.id;
                return (
                  <button
                    key={catalogo.id}
                    onClick={() => setCatalogoActual(catalogo)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-2 border-primary-200 dark:border-primary-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${catalogo.color}20`,
                        color: catalogo.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-left">
                      {catalogo.nombre}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Items */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = catalogoActual.icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {catalogoActual.nombre}
                </CardTitle>
                <Button
                  onClick={iniciarNuevo}
                  disabled={nuevoItem !== null}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-500">Cargando...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Formulario para nuevo item */}
                  <AnimatePresence>
                    {nuevoItem && (
                      <ItemForm
                        item={nuevoItem}
                        onChange={setNuevoItem}
                        onSave={guardarNuevo}
                        onCancel={cancelarNuevo}
                        campos={catalogoActual.campos}
                      />
                    )}
                  </AnimatePresence>

                  {/* Lista de items */}
                  {items.map((item) =>
                    editando?.id === item.id ? (
                      <ItemForm
                        key={item.id}
                        item={editando}
                        onChange={setEditando}
                        onSave={guardarEdicion}
                        onCancel={cancelarEdicion}
                        campos={catalogoActual.campos}
                      />
                    ) : (
                      <ItemCard
                        key={item.id}
                        item={item}
                        campos={catalogoActual.campos}
                        onEdit={() => iniciarEdicion(item)}
                        onDelete={() => eliminarItem(item)}
                      />
                    )
                  )}

                  {items.length === 0 && !nuevoItem && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay elementos. Crea uno nuevo.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar un item
function ItemCard({ item, campos, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
    >
      <div className="flex items-center gap-4 flex-1">
        {campos.includes("color") && item.color && (
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: item.color }}
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.nombre}</h4>
          {campos.includes("descripcion") && item.descripcion && (
            <p className="text-sm text-gray-500 mt-0.5">{item.descripcion}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {campos.includes("categoria") && item.categoria && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {item.categoria}
              </span>
            )}
            {campos.includes("orden") && item.orden && (
              <span className="text-xs text-gray-400">Orden: {item.orden}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="hover:bg-blue-50 hover:text-blue-600"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Componente para formulario (nuevo/editar)
function ItemForm({ item, onChange, onSave, onCancel, campos }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Nombre *
          </label>
          <Input
            value={item.nombre || ""}
            onChange={(e) => onChange({ ...item, nombre: e.target.value })}
            placeholder="Nombre"
            className="bg-white"
          />
        </div>

        {campos.includes("color") && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={item.color || "#6B7280"}
                onChange={(e) => onChange({ ...item, color: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={item.color || ""}
                onChange={(e) => onChange({ ...item, color: e.target.value })}
                placeholder="#000000"
                className="bg-white flex-1"
              />
            </div>
          </div>
        )}

        {campos.includes("categoria") && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Categoría
            </label>
            <Input
              value={item.categoria || ""}
              onChange={(e) => onChange({ ...item, categoria: e.target.value })}
              placeholder="Categoría"
              className="bg-white"
            />
          </div>
        )}

        {campos.includes("orden") && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Orden
            </label>
            <Input
              type="number"
              value={item.orden || ""}
              onChange={(e) =>
                onChange({ ...item, orden: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              className="bg-white"
            />
          </div>
        )}
      </div>

      {campos.includes("descripcion") && (
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Descripción
          </label>
          <Input
            value={item.descripcion || ""}
            onChange={(e) => onChange({ ...item, descripcion: e.target.value })}
            placeholder="Descripción"
            className="bg-white"
          />
        </div>
      )}

      <div className="flex items-center gap-2 justify-end pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </motion.div>
  );
}
