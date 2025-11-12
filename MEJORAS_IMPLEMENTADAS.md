# Mejoras Implementadas - Sistema Legal

## 📋 Resumen de Cambios

### 1. **Soporte para Múltiples Empleados por Proceso**

- ✅ Implementado usando la tabla `proceso_empleados` con relación many-to-many
- ✅ Cada empleado puede tener un rol específico en el proceso
- ✅ Visualización de empleados asignados en ProcesoPanel

### 2. **Selector de Rol del Cliente**

- ✅ Nueva tabla `roles_cliente` con roles predefinidos
- ✅ Campo `rol_cliente_id` en tabla `procesos`
- ✅ Selector agregado en ProcesoPanel
- ✅ Query actualizada en `/app/(dashboard)/procesos/page.jsx`

**Roles disponibles:**

- Demandante
- Demandado
- Actor
- Accionado
- Querellante
- Querellado
- Apelante
- Apelado

### 3. **Integración de Tareas en ProcesoPanel**

- ✅ Visualización de tareas del proceso directamente en el panel
- ✅ Botón "Nueva Tarea" que abre TareaPanel con proceso pre-seleccionado
- ✅ Lista interactiva de tareas con estados y prioridades
- ✅ Click en tarea abre TareaPanel para edición
- ✅ Iconos visuales: ✓ para completadas, ○ para pendientes
- ✅ Badges de color para estados y prioridades

### 4. **Animaciones con Framer Motion**

- ✅ Animación de slide para apertura/cierre de paneles
- ✅ Fade-in para overlays
- ✅ AnimatePresence para transiciones suaves
- ✅ Animaciones en lista de tareas (fade-in, slide-out)
- ✅ Spring physics para movimientos naturales

**Configuración de animaciones:**

```javascript
transition={{ type: "spring", damping: 25, stiffness: 200 }}
```

## 📁 Archivos Modificados

### Componentes

1. **`/components/editable-table/ProcesoPanel.jsx`**

   - ➕ Import de `framer-motion` y `TareaPanel`
   - ➕ Estados: `tareaPanelOpen`, `tareaSeleccionada`, `rolesCliente`
   - ➕ Función `cargarCatalogos()` incluye roles_cliente
   - ➕ Campo `rol_cliente_id` en `guardarNuevoProceso()`
   - ➕ Selector de "Rol del Cliente" en UI
   - ✏️ Query de tareas incluye estado y empleado completo
   - ✏️ Sección de tareas rediseñada con lista interactiva
   - ✏️ Botón "Nueva Tarea" con handler
   - ✏️ Animaciones en overlay y panel principal
   - ➕ TareaPanel integrado con callback de actualización

2. **`/components/editable-table/TareaPanel.jsx`**

   - ➕ Import de `framer-motion`
   - ✏️ Overlay y panel con animaciones
   - ✏️ z-index más alto (10998/10999) para estar sobre ProcesoPanel

3. **`/app/(dashboard)/procesos/page.jsx`**
   - ✏️ Query SELECT incluye `rol_cliente:rol_cliente_id(nombre)`
   - ✏️ Ambas queries (orden y created_at fallback) actualizadas

### Scripts SQL

4. **`/supabase/add_roles_cliente.sql`** (NUEVO)
   - Crea tabla `roles_cliente` si no existe
   - Inserta 8 roles comunes
   - Usa `ON CONFLICT DO NOTHING` para idempotencia

## 🎨 Mejoras Visuales

### ProcesoPanel - Sección de Tareas

```jsx
<AnimatePresence mode="popLayout">
  {tareas.map((tarea) => (
    <motion.div
      key={tarea.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      // Card interactivo con hover
    />
  ))}
</AnimatePresence>
```

**Características visuales:**

- Hover con borde primary-200
- Iconos CheckCircle2/Circle según estado
- Badges con colores de base de datos
- Line-through para tareas completadas
- Truncate en descripciones (line-clamp-1)

### Animaciones de Paneles

- **ProcesoPanel**: z-9998/9999
- **TareaPanel**: z-10998/10999 (mayor prioridad)
- **Spring animation**: Damping 25, Stiffness 200
- **Overlay**: Fade con backdrop-blur

## 🔧 Cómo Usar

### 1. Ejecutar Script SQL

```bash
# Conectarse a Supabase y ejecutar:
psql $DATABASE_URL -f supabase/add_roles_cliente.sql
```

### 2. Verificar Tablas

```sql
-- Verificar roles_cliente
SELECT * FROM roles_cliente;

-- Verificar proceso_empleados
SELECT * FROM proceso_empleados;
```

### 3. Usar en la UI

#### Crear Proceso con Rol

1. Click en "Nuevo Proceso"
2. Seleccionar Cliente
3. Seleccionar Rol del Cliente (Demandante, Demandado, etc.)
4. Click "Guardar Proceso"

#### Gestionar Tareas desde Proceso

1. Abrir ProcesoPanel (click en fila de tabla)
2. Ver lista de tareas del proceso
3. Click en "Nueva Tarea" → Abre TareaPanel con proceso pre-seleccionado
4. Click en tarea existente → Editar en TareaPanel
5. Cambios se reflejan automáticamente

## 🎯 Flujo de Interacción

```
ProcesosTable
    ↓ (click en fila)
ProcesoPanel [z-9999]
    ↓ (click "Nueva Tarea")
TareaPanel [z-10999] ← proceso ya seleccionado
    ↓ (guardar/cerrar)
ProcesoPanel (actualiza lista de tareas)
```

## 🐛 Notas Importantes

1. **Z-Index**: TareaPanel tiene z-index mayor para superponerse a ProcesoPanel
2. **Realtime**: Cambios en tareas se reflejan automáticamente vía Supabase Realtime
3. **Performance**: AnimatePresence con `mode="popLayout"` optimiza re-renders
4. **UX**: Spring physics hace movimientos más naturales vs. easeInOut

## 📊 Esquema de Datos

### Tabla proceso_empleados

```sql
proceso_id → procesos(id)
empleado_id → empleados(id)
rol VARCHAR(100) -- Ej: "Abogado Principal", "Asistente"
fecha_asignacion TIMESTAMP
activo BOOLEAN
```

### Tabla roles_cliente

```sql
id UUID PRIMARY KEY
nombre VARCHAR(100) UNIQUE
descripcion TEXT
created_at TIMESTAMP
```

### Tabla procesos (campo nuevo)

```sql
rol_cliente_id UUID → roles_cliente(id)
```

## ✨ Próximas Mejoras Sugeridas

1. **Empleados múltiples**: UI para asignar/remover empleados del proceso
2. **Roles personalizados**: CRUD de roles_cliente
3. **Filtros**: Filtrar tareas por estado/prioridad en ProcesoPanel
4. **Drag & Drop**: Ordenar tareas por prioridad
5. **Notificaciones**: Toast messages en lugar de alerts

---

**Fecha de implementación**: 12 de noviembre de 2025
**Tecnologías**: React 19, Next.js 16, Framer Motion 12, Supabase
