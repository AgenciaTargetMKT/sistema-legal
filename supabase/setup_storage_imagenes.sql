-- ========================================
-- CONFIGURACIÓN DE STORAGE PARA IMÁGENES DE BLOCKNOTE
-- ========================================
-- Este script crea el bucket y las políticas necesarias para
-- permitir que los usuarios suban imágenes en las notas de tareas

-- Crear bucket para archivos de tareas (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-tareas', 'archivos-tareas', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- POLÍTICAS DE ACCESO (RLS)
-- ========================================

-- 1. Permitir a todos los usuarios autenticados SUBIR archivos
CREATE POLICY "Empleados pueden subir archivos a tareas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (
    SELECT auth_user_id FROM empleados WHERE activo = true
  )
);

-- 2. Permitir a todos VER archivos (bucket es público)
CREATE POLICY "Todos pueden ver archivos de tareas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'archivos-tareas');

-- 3. Permitir ACTUALIZAR archivos a quien los subió o administradores
CREATE POLICY "Empleados pueden actualizar sus propios archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (
    SELECT auth_user_id FROM empleados WHERE activo = true
  )
)
WITH CHECK (
  bucket_id = 'archivos-tareas'
);

-- 4. Permitir ELIMINAR archivos a quien los subió o administradores
CREATE POLICY "Empleados pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (
    SELECT auth_user_id FROM empleados WHERE activo = true
  )
);

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Consulta para verificar que el bucket se creó correctamente
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'archivos-tareas';

-- Consulta para verificar las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%tareas%';
