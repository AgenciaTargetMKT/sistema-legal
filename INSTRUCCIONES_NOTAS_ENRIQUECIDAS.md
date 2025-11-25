# Configuración de Storage y Base de Datos para Notas Enriquecidas

## ⚠️ IMPORTANTE: Pasos a seguir en este orden

### 1. Crear Bucket en Supabase Storage

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **"New bucket"**
4. Configura el bucket con estos valores:

   - **Name**: `notas-imagenes`
   - **Public bucket**: ✅ ACTIVADO (importante para poder ver las imágenes)
   - **Allowed MIME types**: `image/*` (opcional, pero recomendado)
   - **File size limit**: 5 MB (o el que prefieras)

5. Haz clic en **Create bucket**

### 2. Configurar Políticas de Acceso (RLS) para el Bucket

Después de crear el bucket, necesitas configurar las políticas de seguridad:

1. En Storage, selecciona el bucket `notas-imagenes`
2. Ve a la pestaña **Policies**
3. Haz clic en **New policy** y crea estas 3 políticas:

#### Política 1: Permitir subir imágenes (INSERT)

```sql
-- Nombre: Empleados pueden subir imágenes
-- Operation: INSERT
CREATE POLICY "Empleados pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notas-imagenes' AND
  auth.role() = 'authenticated'
);
```

#### Política 2: Permitir leer imágenes (SELECT)

```sql
-- Nombre: Todos pueden ver imágenes públicas
-- Operation: SELECT
CREATE POLICY "Todos pueden ver imágenes públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'notas-imagenes');
```

#### Política 3: Permitir eliminar imágenes (DELETE)

```sql
-- Nombre: Empleados pueden eliminar sus imágenes
-- Operation: DELETE
CREATE POLICY "Empleados pueden eliminar sus imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notas-imagenes' AND
  auth.role() = 'authenticated'
);
```

### 3. Ejecutar el Script SQL para las Tablas de Notas

1. Ve a **SQL Editor** en Supabase
2. Abre el archivo `/supabase/notas_enriquecidas.sql` de tu proyecto
3. Copia TODO el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`

Este script creará:

- ✅ Tabla `notas_bloques` - almacena los bloques de contenido
- ✅ Tabla `notas_historial` - registra todos los cambios
- ✅ Triggers automáticos para tracking de cambios
- ✅ Políticas RLS para seguridad
- ✅ Índices para mejor rendimiento

### 4. Verificar que todo funcionó correctamente

Ejecuta esta query en SQL Editor para verificar:

```sql
-- Verificar que las tablas se crearon
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('notas_bloques', 'notas_historial');

-- Verificar las políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('notas_bloques', 'notas_historial');

-- Verificar el bucket de storage
SELECT * FROM storage.buckets WHERE name = 'notas-imagenes';
```

Deberías ver:

- 2 tablas creadas
- 6 políticas RLS (4 para notas_bloques, 2 para notas_historial)
- 1 bucket configurado

### 5. Probar el Sistema

1. Inicia tu aplicación: `npm run dev`
2. Ve a la página de Tareas
3. Abre una tarea existente (o crea una nueva)
4. En la sección "Notas Enriquecidas":
   - Haz clic en "Agregar bloque"
   - Prueba agregar texto, encabezados, listas
   - Sube una imagen
   - Verifica que se muestra quién y cuándo creó cada bloque

## 🎯 Tipos de Bloques Disponibles

- **Texto**: Párrafos de texto simple
- **Encabezado 1**: Títulos grandes
- **Lista**: Lista con viñetas
- **Lista de tareas**: Con checkboxes
- **Imagen**: Subir imágenes desde tu computadora
- **Cita**: Resaltar texto importante
- **Separador**: Línea divisoria

## 📊 Estructura de Datos

### notas_bloques

```
- id: UUID (primary key)
- tarea_id: UUID (foreign key → tareas)
- tipo: VARCHAR(50) - tipo de bloque
- contenido: JSONB - datos del bloque
- orden: INTEGER - orden de visualización
- empleado_id: UUID - quién creó/modificó
- created_at, updated_at: timestamps
- activo: BOOLEAN
```

### notas_historial

```
- id: UUID (primary key)
- bloque_id: UUID (foreign key → notas_bloques)
- tarea_id: UUID (foreign key → tareas)
- empleado_id: UUID - quién hizo el cambio
- accion: VARCHAR(20) - created/updated/deleted
- contenido_anterior: JSONB
- contenido_nuevo: JSONB
- created_at: timestamp
```

## 🔐 Seguridad

- ✅ Row Level Security (RLS) activado en todas las tablas
- ✅ Solo empleados autenticados pueden crear/editar
- ✅ Solo puedes editar tus propios bloques
- ✅ Todos los cambios quedan registrados en el historial
- ✅ Las imágenes se almacenan en bucket público pero requieren autenticación para subir

## 🎨 Características Especiales

1. **Tracking Automático**: Cada cambio registra:

   - Quién lo hizo (nombre del empleado)
   - Cuándo se hizo (fecha y hora)
   - Qué cambió (contenido anterior y nuevo)

2. **Editor Estilo Notion**:

   - Menú contextual para agregar bloques
   - Drag handles para reordenar (visual)
   - Hover para ver opciones de edición
   - Eliminación suave (activo = false)

3. **Soporte de Imágenes**:
   - Subida drag & drop
   - Vista previa inmediata
   - Metadata de quién y cuándo subió
   - Almacenamiento optimizado en Supabase Storage

## 🆘 Troubleshooting

### Error: "new row violates row-level security policy"

- Verifica que las políticas RLS estén creadas correctamente
- Asegúrate de que el usuario está autenticado
- Revisa que `empleado_id` existe en la tabla `empleados`

### Las imágenes no se muestran

- Verifica que el bucket `notas-imagenes` sea público
- Revisa las políticas del bucket en Storage
- Comprueba que la URL pública se generó correctamente

### Los cambios no se guardan

- Abre la consola del navegador (F12)
- Busca errores en la pestaña Console
- Verifica la conexión a Supabase en Network

## 📝 Notas Adicionales

- Las notas antiguas (campo `notas` de texto simple) se mantienen ocultas pero siguen funcionando
- El historial de cambios se puede consultar en la tabla `notas_historial`
- Las imágenes eliminadas del editor NO se borran del storage (por seguridad)
- Se puede agregar funcionalidad de "Historial de cambios" visible en el futuro

---

**¡Listo!** Ahora tienes un sistema de notas enriquecidas estilo Notion con tracking completo de cambios 🎉
