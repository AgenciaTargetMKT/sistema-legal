-- =====================================================
-- ACTUALIZAR POLÍTICAS RLS DE NOTAS_TAREA
-- =====================================================
-- Este script elimina las políticas restrictivas y crea
-- políticas abiertas para que TODOS los usuarios autenticados
-- puedan ver, crear, editar y eliminar TODAS las notas

-- =====================================================
-- PASO 1: ELIMINAR POLÍTICAS ANTIGUAS
-- =====================================================

DROP POLICY IF EXISTS "Los usuarios pueden ver notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden crear notas para sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar notas de sus tareas" ON notas_tarea;
DROP POLICY IF EXISTS "Los usuarios pueden ver historial de sus notas" ON notas_tarea_historial;

-- =====================================================
-- PASO 2: CREAR POLÍTICAS NUEVAS (ABIERTAS)
-- =====================================================

-- 1. TODOS pueden VER todas las notas
CREATE POLICY "Todos los usuarios pueden ver todas las notas"
  ON notas_tarea
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM empleados WHERE activo = true
    )
  );

-- 2. TODOS pueden CREAR notas en cualquier tarea
CREATE POLICY "Todos los usuarios pueden crear notas"
  ON notas_tarea
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_user_id FROM empleados WHERE activo = true
    )
  );

-- 3. TODOS pueden ACTUALIZAR cualquier nota
CREATE POLICY "Todos los usuarios pueden actualizar notas"
  ON notas_tarea
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM empleados WHERE activo = true
    )
  );

-- 4. TODOS pueden ELIMINAR cualquier nota
CREATE POLICY "Todos los usuarios pueden eliminar notas"
  ON notas_tarea
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM empleados WHERE activo = true
    )
  );

-- 5. TODOS pueden ver el historial de todas las notas
CREATE POLICY "Todos los usuarios pueden ver historial de notas"
  ON notas_tarea_historial
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM empleados WHERE activo = true
    )
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todas las políticas de notas_tarea
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('notas_tarea', 'notas_tarea_historial')
ORDER BY tablename, cmd;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deberías ver 5 políticas:
-- 1. notas_tarea - SELECT - "Todos los usuarios pueden ver todas las notas"
-- 2. notas_tarea - INSERT - "Todos los usuarios pueden crear notas"
-- 3. notas_tarea - UPDATE - "Todos los usuarios pueden actualizar notas"
-- 4. notas_tarea - DELETE - "Todos los usuarios pueden eliminar notas"
-- 5. notas_tarea_historial - SELECT - "Todos los usuarios pueden ver historial de notas"
