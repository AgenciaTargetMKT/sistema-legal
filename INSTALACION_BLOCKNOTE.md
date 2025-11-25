# 📝 Instrucciones de Instalación - BlockNote Editor

## ✅ Pasos Completados

### 1. **Dependencias Instaladas**

```bash
npm install @blocknote/core @blocknote/react @blocknote/mantine
```

### 2. **Archivos Creados**

#### 📄 `/supabase/notas_blocknote.sql`

Script SQL que crea la estructura de base de datos simplificada para BlockNote:

- Tabla `notas_tarea`: Almacena las notas de cada tarea como JSON
- Tabla `notas_tarea_historial`: Historial de cambios para auditoría
- Políticas RLS configuradas correctamente
- Triggers para actualizar timestamps automáticamente

#### 📄 `/components/features/tareas/BlockNoteEditor.jsx`

Componente React para el editor BlockNote con:

- Auto-guardado cada 30 segundos
- Botón de guardado manual
- Indicador de última vez guardado
- Modo lectura/escritura
- Manejo de errores con toasts
- Loading states
- Integración completa con Supabase

#### 📄 `/app/blocknote-custom.css`

Estilos personalizados para BlockNote:

- Tema limpio y profesional
- Animaciones suaves
- Responsive design
- Colores adaptados al sistema

### 3. **Archivos Modificados**

#### ✏️ `/components/features/tareas/index.js`

- Agregado export de `BlockNoteEditor`

#### ✏️ `/components/tables/editable/TareaPanel.jsx`

- Reemplazado `NotionEditor` con `BlockNoteEditor`

#### ✏️ `/app/layout.js`

- Agregado import de estilos personalizados de BlockNote

---

## 🚀 Pasos para Completar la Instalación

### Paso 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** (icono de código en el menú lateral)
3. Crea una nueva query
4. Copia y pega el contenido completo de `/supabase/notas_blocknote.sql`
5. Haz clic en **Run** para ejecutar el script
6. Verifica que se haya ejecutado correctamente (debería mostrar "Success")

### Paso 2: Verificar Tablas Creadas

Ejecuta este query en el SQL Editor para verificar:

```sql
-- Verificar tabla notas_tarea
SELECT * FROM notas_tarea LIMIT 1;

-- Verificar tabla notas_tarea_historial
SELECT * FROM notas_tarea_historial LIMIT 1;

-- Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('notas_tarea', 'notas_tarea_historial');
```

### Paso 3: Probar el Editor

1. Reinicia el servidor de desarrollo si está corriendo:

   ```bash
   npm run dev
   ```

2. Abre tu aplicación y:
   - Crea una nueva tarea o abre una existente
   - Ve a la sección "Notas Enriquecidas"
   - Deberías ver el editor BlockNote funcionando

---

## 📚 Estructura de Datos

### Tabla `notas_tarea`

| Campo                    | Tipo      | Descripción                   |
| ------------------------ | --------- | ----------------------------- |
| `id`                     | UUID      | ID único de la nota           |
| `tarea_id`               | UUID      | ID de la tarea (relación 1:1) |
| `contenido`              | JSONB     | Array de bloques de BlockNote |
| `empleado_modificado_id` | UUID      | Último empleado que modificó  |
| `created_at`             | Timestamp | Fecha de creación             |
| `updated_at`             | Timestamp | Última modificación           |

### Formato del Contenido (JSONB)

El campo `contenido` almacena un array de bloques de BlockNote. Ejemplo:

```json
[
  {
    "id": "uuid-1",
    "type": "paragraph",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [
      {
        "type": "text",
        "text": "Este es un párrafo de ejemplo",
        "styles": {}
      }
    ],
    "children": []
  },
  {
    "id": "uuid-2",
    "type": "heading",
    "props": {
      "level": 1,
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [
      {
        "type": "text",
        "text": "Título Principal",
        "styles": {
          "bold": true
        }
      }
    ],
    "children": []
  }
]
```

---

## 🎨 Personalización del Editor

### Cambiar Tema

En `BlockNoteEditor.jsx`, puedes cambiar el tema del editor:

```jsx
<BlockNoteView
  editor={editor}
  editable={!readOnly}
  theme="light" // Opciones: "light" | "dark"
/>
```

### Cambiar Intervalo de Auto-guardado

Por defecto es 30 segundos. Para cambiarlo, modifica esta línea en `BlockNoteEditor.jsx`:

```jsx
const interval = setInterval(() => {
  guardarNotas();
}, 30000); // Cambiar a 60000 para 1 minuto
```

### Personalizar Estilos

Edita `/app/blocknote-custom.css` para cambiar:

- Colores
- Tamaños de fuente
- Espaciado
- Animaciones

---

## 🔧 Solución de Problemas

### Error: "Module not found: @blocknote/core"

**Solución:**

```bash
cd /Volumes/Aldair/TARGET/sistema-legal
npm install --force @blocknote/core @blocknote/react @blocknote/mantine
```

### Error: "relation 'notas_tarea' does not exist"

**Solución:**

- Asegúrate de haber ejecutado el script SQL en Supabase
- Verifica que estés conectado a la base de datos correcta

### El editor no guarda los cambios

**Solución:**

1. Verifica que las políticas RLS estén configuradas correctamente
2. Verifica que el usuario tenga permisos en la tabla `empleados`
3. Revisa la consola del navegador para ver errores específicos

### Los estilos no se aplican correctamente

**Solución:**

1. Asegúrate de que `/app/blocknote-custom.css` esté importado en `layout.js`
2. Limpia el cache del navegador (Ctrl + Shift + R)
3. Reinicia el servidor de desarrollo

---

## 📖 Recursos Adicionales

- [Documentación Oficial de BlockNote](https://www.blocknotejs.org/docs)
- [Estructura de Documentos](https://www.blocknotejs.org/docs/foundations/document-structure)
- [API del Editor](https://www.blocknotejs.org/docs/editor-api/getting-started)
- [Personalización](https://www.blocknotejs.org/docs/ui-components/block-side-menu)

---

## ✨ Características del Editor

### Bloques Disponibles

- ✏️ **Párrafo**: Texto normal
- 📌 **Títulos**: H1, H2, H3
- 📝 **Listas**: Con viñetas y numeradas
- ☑️ **Checklist**: Lista de tareas
- 💻 **Código**: Bloques de código con sintaxis
- 💬 **Cita**: Bloques de cita
- 🖼️ **Imagen**: Subir y mostrar imágenes
- 📊 **Tabla**: Tablas editables
- ➖ **Divisor**: Línea horizontal

### Atajos de Teclado

- **Ctrl/Cmd + B**: Negrita
- **Ctrl/Cmd + I**: Cursiva
- **Ctrl/Cmd + U**: Subrayado
- **Ctrl/Cmd + Z**: Deshacer
- **Ctrl/Cmd + Shift + Z**: Rehacer
- **/**: Abrir menú de bloques
- **Tab**: Indentar
- **Shift + Tab**: Desindentar

### Funcionalidades

- ✅ **Drag & Drop**: Arrastra bloques para reordenarlos
- ✅ **Auto-guardado**: Guarda automáticamente cada 30 segundos
- ✅ **Historial**: Deshacer/Rehacer cambios
- ✅ **Formato Rico**: Negrita, cursiva, colores, etc.
- ✅ **Responsive**: Funciona en móvil y desktop
- ✅ **Modo Lectura**: Para ver notas sin editar

---

## 🎯 Próximos Pasos (Opcional)

### 1. **Colaboración en Tiempo Real**

Puedes agregar colaboración en tiempo real usando:

- [Y.js](https://yjs.dev/) con BlockNote
- Supabase Realtime para sincronización

### 2. **Exportar Documentos**

Agregar opciones para exportar:

- PDF
- Markdown
- HTML
- Word

### 3. **Historial de Versiones**

Implementar un visor de historial que muestre:

- Cambios realizados
- Quién los hizo
- Cuándo se hicieron
- Posibilidad de revertir

### 4. **Comentarios y Menciones**

Agregar funcionalidad para:

- Comentar en bloques específicos
- Mencionar a otros usuarios (@nombre)
- Notificaciones de menciones

---

## ✅ Checklist de Instalación

- [ ] Dependencias npm instaladas
- [ ] Script SQL ejecutado en Supabase
- [ ] Tablas `notas_tarea` y `notas_tarea_historial` creadas
- [ ] Políticas RLS configuradas
- [ ] Componente `BlockNoteEditor` creado
- [ ] Estilos personalizados aplicados
- [ ] `TareaPanel` actualizado
- [ ] Servidor reiniciado
- [ ] Editor probado y funcionando
- [ ] Guardado automático verificado

---

## 💡 Consejos de Uso

1. **Guarda frecuentemente**: Aunque hay auto-guardado, usa el botón "Guardar ahora" antes de cerrar el panel
2. **Usa atajos**: Los atajos de teclado hacen más rápida la edición
3. **Estructura tus notas**: Usa títulos y listas para organizar mejor
4. **Drag & Drop**: Arrastra bloques para reorganizar fácilmente

---

¡El editor BlockNote está listo para usar! 🚀
