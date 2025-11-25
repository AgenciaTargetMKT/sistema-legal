# 🔧 Solución de Bugs - Tareas y BlockNote

## ✅ Bugs Corregidos

### 1. **Bug: Tareas desaparecen al editarlas en "Mis Tareas"**

**Problema:** Cuando editabas una tarea en la vista "Mis Tareas", la tarea desaparecía temporalmente y tenías que recargar la página.

**Causa:** El filtro solo verificaba `emp?.empleado?.id` pero después de actualizar la tarea, la estructura de datos podía venir como `emp?.empleado_id`, causando que el filtro no encontrara coincidencias.

**Solución:**

- Mejorado el filtro para verificar ambas formas de ID: `emp?.empleado?.id || emp?.empleado_id`
- Agregada validación de arrays vacíos antes de usar `.some()`
- Ahora el filtro es más robusto y mantiene las tareas visibles después de editarlas

**Archivo modificado:** `/app/(protected)/tareas/page.jsx` líneas 175-203

---

### 2. **Bug: No se pueden subir imágenes locales en BlockNote**

**Problema:** BlockNote solo permitía pegar URLs de imágenes, no subir archivos desde tu dispositivo.

**Causa:** El editor no tenía configurada la función `uploadFile` para manejar la carga de archivos.

**Solución:**

- Agregada función `uploadFile` que sube imágenes a Supabase Storage
- Las imágenes se guardan en el bucket `archivos-tareas`
- Cada imagen tiene un nombre único: `{tareaId}_{timestamp}.{extension}`
- Retorna la URL pública para que BlockNote la inserte

**Archivo modificado:** `/components/features/tareas/BlockNoteEditor.jsx` líneas 21-49

---

## 📋 Instrucciones de Configuración

### Paso 1: Ejecutar SQL en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Ve a **SQL Editor**
3. Abre el archivo: `/supabase/EJECUTAR_ESTE_SQL.sql` ⭐ **IMPORTANTE: USA ESTE ARCHIVO**
4. Copia todo el contenido y pégalo en el SQL Editor
5. Haz clic en **Run** (o presiona `Ctrl/Cmd + Enter`)

Este script creará:

- ✅ Bucket público `archivos-tareas` para almacenar imágenes
- ✅ Políticas RLS para permitir subir/ver/editar/eliminar archivos
- ✅ **Políticas RLS actualizadas: TODOS los usuarios pueden ver TODAS las notas** 🔓
- ✅ Verificaciones para confirmar que todo está correcto

### Paso 2: Verificar que funciona

1. Recarga la aplicación en el navegador
2. Abre cualquier tarea en "Mis Tareas"
3. Haz clic en el editor de notas (BlockNote)
4. Intenta:
   - **Subir imagen:** Haz clic en el botón de imagen y selecciona "Upload"
   - **Editar tarea:** Cambia el responsable o cualquier campo
   - **Verificar que no desaparece:** La tarea debe mantenerse visible

---

## 🎯 Cómo usar las imágenes en BlockNote

### Opción 1: Subir desde tu dispositivo (NUEVA ✨)

1. Haz clic en el botón **"+"** en el editor
2. Selecciona **"Image"**
3. Haz clic en **"Upload"**
4. Selecciona una imagen de tu computadora
5. ¡Listo! La imagen se sube automáticamente

### Opción 2: Pegar URL de internet

1. Haz clic en el botón **"+"** en el editor
2. Selecciona **"Image"**
3. Pega la URL de una imagen de internet

### Opción 3: Arrastrar y soltar

1. Arrastra una imagen desde tu explorador de archivos
2. Suéltala directamente en el editor
3. Se subirá automáticamente

---

## 🔍 Archivos Modificados

```
/app/(protected)/tareas/page.jsx
  - Líneas 175-203: Mejorado filtro de "Mis Tareas"

/components/features/tareas/BlockNoteEditor.jsx
  - Líneas 21-49: Agregada función uploadFile

/supabase/setup_storage_imagenes.sql (NUEVO)
  - Script SQL para configurar Storage
```

---

## 🐛 Debug del Filtro

Si aún tienes problemas con las tareas que desaparecen, puedes agregar este console.log temporal:

```javascript
// En /app/(protected)/tareas/page.jsx después de la línea 175
console.log("🔍 Filtrando tarea:", {
  tareaId: tarea.id,
  tareaNombre: tarea.nombre,
  empleadoId: empleado.id,
  esCreador,
  esResponsable,
  esDesignado,
  esMiTarea,
  responsables: tarea.empleados_responsables,
  designados: tarea.empleados_designados,
});
```

Esto te mostrará en la consola del navegador por qué una tarea se está filtrando o no.

---

## ✅ Testing Checklist

- [ ] El bucket `archivos-tareas` existe en Supabase Storage
- [ ] Puedes subir una imagen desde tu dispositivo en BlockNote
- [ ] La imagen se muestra correctamente después de subirla
- [ ] Las tareas no desaparecen al editarlas en "Mis Tareas"
- [ ] Puedes editar responsables y la tarea sigue visible
- [ ] Puedes editar cualquier campo y la tarea permanece

---

## 🆘 Solución de Problemas

### Error: "Error al subir la imagen"

- Verifica que ejecutaste el SQL en Supabase
- Verifica que el bucket `archivos-tareas` existe
- Revisa las políticas RLS en Storage

### Las tareas siguen desapareciendo

- Abre la consola del navegador (F12)
- Busca errores en rojo
- Agrega el console.log de debug (ver sección anterior)
- Verifica que `empleado.id` tenga un valor válido

### Las imágenes no se cargan

- Verifica la URL en la consola de red (F12 → Network)
- Asegúrate de que el bucket sea público
- Revisa que las políticas permitan SELECT a public
