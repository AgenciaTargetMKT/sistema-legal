# Cambios en Panel de Tareas - Estilo Notion

## 📋 Resumen

Se ha rediseñado completamente el `TareaPanel` para que sea más compacto y similar a Notion, eliminando campos innecesarios y automatizando funcionalidades.

## 🗑️ Campos Eliminados

### Gestión de Tiempo

- ❌ **Tiempo Estimado** (horas)
- ❌ **Tiempo Real** (horas)

**Razón**: Estos campos ocupaban mucho espacio y no son esenciales para el flujo de trabajo actual.

## 🔄 Cambios en Fechas

### Fecha Límite → Recordatorio

- ✅ Ahora incluye **fecha + hora**
- 🔔 Se usa para crear recordatorios en el calendario
- 📅 Formato: `DD/MMM/YYYY HH:MM`

### Fecha Completada

- 🔒 **No editable manualmente**
- 🤖 **Se establece automáticamente** cuando el estado cambia a "completada"
- ⚡ Trigger de base de datos: `trigger_auto_completar_tarea`

## 🎨 Nuevo Diseño

### Layout Compacto

- **Ancho**: 1200px → **680px** (43% más compacto)
- **Diseño**: 2 columnas → **1 columna** con propiedades inline
- **Estilo**: Similar a Notion con hover effects

### Propiedades en Formato Notion

```
[Icon] Label          Valor editable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Proceso            001-2025 - Nombre
⚠️ Estado             [Badge: completada]
👤 Asignado           Juan Pérez
⚠️ Prioridad          [Badge: Alta]
📅 Recordatorio       12 nov 2025 14:30
📅 Vencimiento        15 dic 2025
📅 Completada         13 nov 2025 10:23
```

### Secciones

1. **Propiedades** (inline, estilo Notion)
2. **Descripción** (área de texto multilínea)
3. **Observaciones** (área de texto multilínea)
4. **Metadatos** (creada, actualizada - solo lectura)

## 🔧 Automatización de Base de Datos

### Script SQL: `auto_completar_tarea.sql`

```sql
-- Función que se ejecuta automáticamente
CREATE FUNCTION auto_completar_tarea()
  - Si estado = "completada" → fecha_completada = NOW()
  - Si estado ≠ "completada" → fecha_completada = NULL

-- Trigger
CREATE TRIGGER trigger_auto_completar_tarea
  BEFORE INSERT OR UPDATE OF estado_id ON tareas
```

### ¿Cómo funciona?

1. Usuario cambia estado a "completada"
2. Trigger detecta el cambio
3. Automáticamente se establece `fecha_completada = NOW()`
4. Si el estado vuelve a cambiar, se limpia `fecha_completada`

## 📦 Componentes Nuevos

### `PropertyRow`

Fila de propiedad estilo Notion con icono, label y valor editable inline.

### `EditableDateWithTime`

Componente para editar fecha + hora (usado en "Recordatorio").

### Componentes Actualizados

- `EditableText` - Modo compacto sin label
- `EditableSelect` - Modo compacto con prop `compact`
- `EditableDate` - Modo compacto

## 🚀 Instrucciones de Instalación

### 1. Ejecutar Script SQL

```sql
-- En Supabase SQL Editor
\i supabase/auto_completar_tarea.sql
```

### 2. Verificar Trigger

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_completar_tarea';
```

### 3. Probar Funcionalidad

1. Abre una tarea
2. Cambia el estado a "completada"
3. Verifica que `fecha_completada` se establezca automáticamente
4. Cambia el estado a otro
5. Verifica que `fecha_completada` se limpie

## 📱 Características del Nuevo Panel

### Interacciones

- ✅ Click en cualquier campo para editar
- ✅ Hover effects en todas las propiedades
- ✅ Enter para guardar (excepto en multilínea)
- ✅ Escape para cancelar
- ✅ Focus ring azul (#0091FF) al editar
- ✅ Dropdowns con Popper.js (posicionamiento fijo)

### Diseño Responsivo

- Ancho fijo: 680px
- Scroll vertical si el contenido es largo
- Overlay con blur para el fondo
- Z-index alto para estar sobre todo

### Accesibilidad

- Estados visuales claros (hover, focus, editing)
- Colores de badge con contraste adecuado
- Iconos descriptivos para cada propiedad
- Placeholders informativos

## 🎯 Beneficios

1. **Más Compacto**: 43% menos ancho, mejor uso del espacio
2. **Más Rápido**: Menos campos = menos scroll = más eficiente
3. **Automatizado**: Fecha completada sin intervención manual
4. **Intuitivo**: Diseño similar a Notion = curva de aprendizaje baja
5. **Limpio**: Solo los campos esenciales

## 🔗 Integración con Calendario

La **Fecha Límite** (ahora "Recordatorio") con hora permite:

- Crear eventos en Google Calendar con hora exacta
- Enviar notificaciones/recordatorios
- Sincronizar con sistemas externos

## 📝 Notas Técnicas

### CSS Variables

- `--primary-*`: Colores principales (#0091FF)
- `bg-primary-50`: Fondo de inputs activos
- `ring-primary-400`: Focus ring

### React Hooks

- `useState`: Manejo de estado de edición
- `useEffect`: Sincronización de valores
- `useRef`: Referencias para ContentEditable

### Librerías

- `react-contenteditable`: Edición inline
- `react-popper`: Posicionamiento de dropdowns
- `clsx`: Clases condicionales
- `lucide-react`: Iconos

## 🐛 Troubleshooting

### El trigger no funciona

```sql
-- Verificar que la función existe
SELECT proname FROM pg_proc WHERE proname = 'auto_completar_tarea';

-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_completar_tarea';

-- Recrear si es necesario
\i supabase/auto_completar_tarea.sql
```

### Fecha completada no se actualiza

1. Verifica que el estado se llama exactamente "completada" (minúsculas)
2. Verifica que `estados_tarea` tiene un registro con `nombre = 'completada'`
3. Revisa los logs de Supabase para errores

### Panel no se ve compacto

- Verifica que el ancho es `w-[680px]` en el div principal
- Limpia la caché del navegador
- Verifica que no hay estilos CSS conflictivos

## ✅ Checklist de Implementación

- [x] Crear script SQL `auto_completar_tarea.sql`
- [x] Actualizar `TareaPanel.jsx` con diseño compacto
- [x] Eliminar campos de gestión de tiempo
- [x] Agregar componente `PropertyRow`
- [x] Agregar componente `EditableDateWithTime`
- [x] Actualizar componentes editables para modo compacto
- [x] Hacer fecha completada no editable
- [ ] Ejecutar script SQL en Supabase
- [ ] Probar cambio de estado a completada
- [ ] Verificar integración con calendario
- [ ] Probar todos los campos editables
- [ ] Verificar responsive design

## 📚 Referencias

- [Notion Database Properties](https://www.notion.so/help/database-properties)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [React Popper](https://popper.js.org/react-popper/)
