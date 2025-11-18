"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import DataEditor, { GridCellKind } from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function GlideProcesosTable({
  procesos: initialProcesos,
  onUpdate,
  onProcesoClick,
}) {
  const [procesos, setProcesos] = useState(initialProcesos || []);
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [rolesCliente, setRolesCliente] = useState([]);

  useEffect(() => {
    setProcesos(initialProcesos || []);
  }, [initialProcesos]);

  // Cargar catálogos al inicio
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [clientesRes, estadosRes, rolesRes] = await Promise.all([
        supabase.from("clientes").select("id, nombre").order("nombre"),
        supabase
          .from("estados_proceso")
          .select("id, nombre, color")
          .order("nombre"),
        supabase.from("roles_cliente").select("id, nombre").order("nombre"),
      ]);

      if (clientesRes.data) setClientes(clientesRes.data);
      if (estadosRes.data) setEstados(estadosRes.data);
      if (rolesRes.data) setRolesCliente(rolesRes.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  // Definir las columnas - Mejor distribución del espacio
  const columns = useMemo(
    () => [
      {
        title: "Nombre",
        id: "nombre",
        width: 250,
      },
      {
        title: "Cliente",
        id: "cliente",
        width: 180,
      },
      {
        title: "Estado",
        id: "estado",
        width: 130,
      },
      {
        title: "ROL",
        id: "contra_parte",
        width: 150,
      },
      {
        title: "Última Actualización",
        id: "ultima_act_descripcion",
        width: 280,
      },
      {
        title: "Fecha Act.",
        id: "ultima_act_fecha",
        width: 110,
      },
      {
        title: "Fecha",
        id: "fecha_inicio",
        width: 110,
      },
      {
        title: "⚡",
        id: "impulso",
        width: 70,
      },
      {
        title: "📋",
        id: "acciones",
        width: 70,
      },
    ],
    []
  );

  // Callback para obtener el contenido de cada celda
  const getCellContent = useCallback(
    (cell) => {
      const [col, row] = cell;
      const proceso = procesos[row];
      if (!proceso) return { kind: GridCellKind.Loading };

      const columnId = columns[col].id;

      switch (columnId) {
        case "nombre":
          return {
            kind: GridCellKind.Text,
            displayData: proceso.nombre || "",
            data: proceso.nombre || "",
            allowOverlay: true,
            readonly: false,
          };

        case "cliente":
          // Crear array de opciones para el dropdown
          const clientesOptions = clientes.map((c) => c.nombre);
          const clienteActual = proceso.cliente?.nombre || "";

          return {
            kind: GridCellKind.Dropdown,
            allowedValues: clientesOptions,
            value: clienteActual,
            allowOverlay: true,
            readonly: false,
            themeOverride: proceso.cliente
              ? {
                  bgCell: "#EEF2FF",
                  textDark: "#4F46E5",
                }
              : undefined,
          };

        case "estado":
          // Crear array de opciones para el dropdown
          const estadosOptions = estados.map((e) => e.nombre);
          const estadoActual = proceso.estado?.nombre || "";

          return {
            kind: GridCellKind.Dropdown,
            allowedValues: estadosOptions,
            value: estadoActual,
            data: estadoActual,
            displayData: estadoActual || "Seleccionar...",
            allowOverlay: true,
            readonly: false,
            themeOverride: proceso.estado
              ? {
                  bgCell: proceso.estado?.color
                    ? `${proceso.estado.color}20`
                    : "#f3f4f6",
                  textDark: proceso.estado?.color || "#374151",
                }
              : undefined,
          };

        case "contra_parte":
          return {
            kind: GridCellKind.Text,
            displayData: proceso.contra_parte || "",
            data: proceso.contra_parte || "",
            allowOverlay: true,
            readonly: false,
          };

        case "ultima_act_descripcion":
          const ultimaAct = proceso.ultima_actualizacion;
          let descripcion = "Agregar comentario...";

          if (ultimaAct && ultimaAct.descripcion) {
            descripcion = ultimaAct.descripcion;
          }

          return {
            kind: GridCellKind.Text,
            displayData: descripcion,
            data: ultimaAct?.descripcion || "",
            allowOverlay: true,
            readonly: false,
            allowWrapping: true,
            themeOverride: ultimaAct
              ? undefined
              : {
                  textDark: "#9ca3af",
                },
          };

        case "ultima_act_fecha":
          const ultimaActFecha = proceso.ultima_actualizacion;
          let fechaDisplay = "-";

          if (ultimaActFecha && ultimaActFecha.fecha_actualizacion) {
            const fecha = new Date(ultimaActFecha.fecha_actualizacion);
            fechaDisplay = fecha.toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
          } else if (proceso.updated_at) {
            const fecha = new Date(proceso.updated_at);
            fechaDisplay = fecha.toLocaleString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          return {
            kind: GridCellKind.Text,
            displayData: fechaDisplay,
            data:
              ultimaActFecha?.fecha_actualizacion || proceso.updated_at || "",
            allowOverlay: false,
            readonly: true,
            contentAlign: "left",
          };

        case "fecha_inicio":
          let fechaInicioDisplay = "";
          if (proceso.fecha_inicio) {
            const fecha = new Date(proceso.fecha_inicio);
            fechaInicioDisplay = fecha.toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          return {
            kind: GridCellKind.Text,
            displayData: fechaInicioDisplay,
            data: proceso.fecha_inicio || "",
            allowOverlay: true,
            readonly: false,
          };

        case "impulso":
          return {
            kind: GridCellKind.Boolean,
            data: proceso.impulso || false,
            allowOverlay: false,
            readonly: false,
          };

        case "acciones":
          return {
            kind: GridCellKind.Text,
            displayData: "📋",
            data: "edit",
            allowOverlay: false,
            readonly: true,
            themeOverride: {
              bgCell: "#6C5CE720",
              textDark: "#6C5CE7",
            },
          };

        default:
          return {
            kind: GridCellKind.Text,
            displayData: "",
            data: "",
            allowOverlay: false,
          };
      }
    },
    [procesos, columns, clientes, estados]
  );

  // Manejar edición de celdas - SIN recargar toda la tabla
  const onCellEdited = useCallback(
    async (cell, newValue) => {
      const [col, row] = cell;
      const proceso = procesos[row];
      const columnId = columns[col].id;

  

      let updateValue;
      let updateField = columnId;

      if (newValue.kind === GridCellKind.Boolean) {
        updateValue = newValue.data;
      } else if (newValue.kind === GridCellKind.Text) {
        updateValue = newValue.data;
      } else if (newValue.kind === GridCellKind.Dropdown) {
        updateValue = newValue.value;

        // Si es cliente o estado, necesitamos obtener el ID
        if (columnId === "cliente") {
          const clienteSeleccionado = clientes.find(
            (c) => c.nombre === updateValue
          );
          updateValue = clienteSeleccionado?.id || null;
          updateField = "cliente_id";
        } else if (columnId === "estado") {
          const estadoSeleccionado = estados.find(
            (e) => e.nombre === updateValue
          );
          updateValue = estadoSeleccionado?.id || null;
          updateField = "estado_id";
        }
      }


      try {
        // Caso especial: si es la columna de última actualización, crear un nuevo comentario
        if (columnId === "ultima_act_descripcion") {
          if (!updateValue || updateValue.trim() === "") {
            alert("El comentario no puede estar vacío");
            return;
          }

          // Insertar nuevo comentario
          const { data: nuevoComentario, error: errorComentario } =
            await supabase
              .from("comentarios")
              .insert({
                proceso_id: proceso.id,
                contenido: updateValue,
                tipo: "nota",
              })
              .select()
              .single();

          if (errorComentario) {
            console.error("Error al crear comentario:", errorComentario);
            alert("Error al crear comentario: " + errorComentario.message);
            return;
          }
          // Actualizar estado local con el nuevo comentario
          const newProcesos = [...procesos];
          newProcesos[row] = {
            ...newProcesos[row],
            ultima_actualizacion: {
              descripcion: nuevoComentario.contenido,
              fecha_actualizacion: nuevoComentario.created_at,
            },
          };
          setProcesos(newProcesos);

          return;
        }

        // Para todas las demás columnas, actualizar normalmente
        // Luego actualizar en Supabase en background
        const { error } = await supabase
          .from("procesos")
          .update({ [updateField]: updateValue })
          .eq("id", proceso.id);

        if (error) {
          console.error("Error al actualizar:", error);
          alert("Error al actualizar: " + error.message);
          return;
        }

        // Si fue un dropdown (cliente o estado), recargar para obtener los datos completos
        if (columnId === "cliente" || columnId === "estado") {
          onUpdate?.();
        } else {
          // Para campos simples, actualizar estado local
          const newProcesos = [...procesos];
          newProcesos[row] = {
            ...newProcesos[row],
            [columnId]: updateValue,
          };
          setProcesos(newProcesos);
        }

        // NO llamamos onUpdate() para evitar recargar toda la tabla
      } catch (error) {
        console.error("Error al actualizar:", error);
        setProcesos(procesos); // Revertir
        alert("Error al actualizar: " + error.message);
      }
    },
    [procesos, columns, clientes, estados, onUpdate]
  );

  // Manejar cuando se agrega una nueva fila (solo agregar 1 fila al inicio)
  const onRowAppended = useCallback(async () => {
    try {
      // Obtener el último orden
      const ultimoOrden =
        procesos.length > 0
          ? Math.max(...procesos.map((p) => p.orden || 0))
          : 0;

      // Crear nuevo proceso con valores por defecto - SOLO 1
      const nuevoProceso = {
        numero_proceso: `NUEVO-${Date.now()}`,
        nombre: "Nuevo Proceso",
        impulso: false,
        orden: ultimoOrden + 1,
        estado_general: "pendiente",
      };

      const { data, error } = await supabase
        .from("procesos")
        .insert([nuevoProceso])
        .select(
          `
          *,
          cliente:clientes(nombre, documento_identidad),
          materia:materias(nombre),
          estado:estados_proceso(nombre, color),
          tipo_proceso:tipos_proceso(nombre),
          ultima_actualizacion:actualizaciones_proceso!procesos_ultima_actualizacion_id_fkey(descripcion, fecha_actualizacion)
        `
        )
        .single();

      if (error) throw error;

      // Actualizar estado local - agregar AL INICIO
      setProcesos([data, ...procesos]);

      // Notificar actualización
      onUpdate?.();
    } catch (error) {
      console.error("Error al crear proceso:", error);
      alert("Error al crear proceso: " + error.message);
    }
  }, [procesos, onUpdate]);

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate?.()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </Button>
          <span className="text-sm text-gray-600">
            {procesos.length} proceso(s) • Haz scroll abajo para agregar nueva
            fila
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border overflow-hidden">
        <DataEditor
          getCellContent={getCellContent}
          columns={columns}
          rows={procesos.length}
          onCellEdited={onCellEdited}
          onRowAppended={onRowAppended}
          rowSelect="none"
          editOnClick={true}
          trailingRowOptions={{
            hint: "Nueva fila...",
            sticky: false,
            tint: true,
          }}
          smoothScrollX={true}
          smoothScrollY={true}
          height="calc(100vh - 350px)"
          width="100%"
          rowMarkers="both"
          theme={{
            accentColor: "#6C5CE7",
            accentLight: "#8c7ef5",
            textDark: "#1f2937",
            textMedium: "#6b7280",
            textLight: "#9ca3af",
            textBubble: "#1f2937",
            bgIconHeader: "#f9fafb",
            fgIconHeader: "#6b7280",
            textHeader: "#374151",
            textHeaderSelected: "#6C5CE7",
            bgCell: "#ffffff",
            bgCellMedium: "#f9fafb",
            bgHeader: "#f9fafb",
            bgHeaderHasFocus: "#f3f4f6",
            bgHeaderHovered: "#f3f4f6",
            bgBubble: "#ffffff",
            bgBubbleSelected: "#f3f4f6",
            bgSearchResult: "#fff3cd",
            borderColor: "#e5e7eb",
            drilldownBorder: "#6C5CE7",
            linkColor: "#6C5CE7",
            headerFontStyle: "600 12px",
            baseFontStyle: "13px",
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          onCellClicked={(cell) => {
            const [col, row] = cell;
            const proceso = procesos[row];
            const columnId = columns[col].id;

            // Solo la columna de acciones y fecha abre el panel/modal
            // Cliente y Estado ahora son dropdowns editables directamente
            const celdasRelacion = ["acciones", "ultima_act_fecha"];

            if (proceso && celdasRelacion.includes(columnId)) {
              // Abrir el panel para editar todo el proceso
              onProcesoClick?.(proceso);
            }
          }}
          onCellActivated={(cell) => {
            // Esta función se llama cuando una celda se activa para edición
            // Devolver true para permitir la edición inmediata
            const [col, row] = cell;
            const columnId = columns[col].id;

            // Permitir edición inmediata en dropdowns
            if (columnId === "cliente" || columnId === "estado") {
              return true;
            }

            return undefined;
          }}
        />
      </div>
    </div>
  );
}
