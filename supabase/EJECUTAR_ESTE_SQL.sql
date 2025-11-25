-- =====================================================
-- EJECUTA ESTE SCRIPT EN SUPABASE SQL EDITOR
-- =====================================================
-- Este script hace dos cosas:
-- 1. Habilita la carga de imágenes locales en BlockNote
-- 2. Permite que TODOS los usuarios vean TODAS las notas

-- =====================================================
-- PARTE 1: STORAGE PARA IMÁGENES
-- =====================================================

-- 1. Crear bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-tareas', 'archivos-tareas', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir subir archivos
CREATE POLICY "Empleados pueden subir archivos a tareas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

-- 3. Permitir ver archivos (público)
CREATE POLICY "Todos pueden ver archivos de tareas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'archivos-tareas');

-- 4. Permitir actualizar archivos
CREATE POLICY "Empleados pueden actualizar sus propios archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

-- 5. Permitir eliminar archivos
CREATE POLICY "Empleados pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'archivos-tareas' AND
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

-- =====================================================
-- PARTE 2: ACTUALIZAR POLÍTICAS DE NOTAS
-- =====================================================
-- Eliminar políticas restrictivas y crear políticas abiertas

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Los usuarios pueden ver notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden crear notas para sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden ver historial de sus notas" ON notas_tarea_historial;

-- Crear políticas nuevas (TODOS pueden ver/editar TODAS las notas)
CREATE POLICY "Todos los usuarios pueden ver todas las notas"
ON notas_tarea FOR SELECT
USING (
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

CREATE POLICY "Todos los usuarios pueden crear notas"
ON notas_tarea FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

CREATE POLICY "Todos los usuarios pueden actualizar notas"
ON notas_tarea FOR UPDATE
USING (
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

CREATE POLICY "Todos los usuarios pueden eliminar notas"
ON notas_tarea FOR DELETE
USING (
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);

CREATE POLICY "Todos los usuarios pueden ver historial de notas"
ON notas_tarea_historial FOR SELECT
USING (
  auth.uid() IN (SELECT auth_user_id FROM empleados WHERE activo = true)
);
