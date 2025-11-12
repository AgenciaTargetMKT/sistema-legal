-- ============================================
-- POLÍTICAS RLS PARA TABLA PROCESOS
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- 1. HABILITAR RLS EN LA TABLA PROCESOS (si no está habilitado)
ALTER TABLE procesos ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES (si las hay)
DROP POLICY IF EXISTS "procesos_select" ON procesos;
DROP POLICY IF EXISTS "procesos_insert" ON procesos;
DROP POLICY IF EXISTS "procesos_update" ON procesos;
DROP POLICY IF EXISTS "procesos_delete" ON procesos;
DROP POLICY IF EXISTS "procesos_select_all" ON procesos;
DROP POLICY IF EXISTS "procesos_insert_all" ON procesos;
DROP POLICY IF EXISTS "procesos_update_all" ON procesos;
DROP POLICY IF EXISTS "procesos_delete_all" ON procesos;

-- 3. CREAR POLÍTICAS PERMISIVAS
-- Todos los usuarios autenticados pueden ver procesos
CREATE POLICY "procesos_select_all"
ON procesos FOR SELECT
TO authenticated
USING (true);

-- Todos los usuarios autenticados pueden crear procesos
CREATE POLICY "procesos_insert_all"
ON procesos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Todos los usuarios autenticados pueden actualizar procesos
CREATE POLICY "procesos_update_all"
ON procesos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Todos los usuarios autenticados pueden eliminar procesos
CREATE POLICY "procesos_delete_all"
ON procesos FOR DELETE
TO authenticated
USING (true);

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'procesos'
ORDER BY policyname;

-- ============================================
-- ✅ Ahora los usuarios autenticados podrán:
-- - Ver todos los procesos (SELECT)
-- - Crear nuevos procesos (INSERT)
-- - Actualizar procesos existentes (UPDATE)
-- - Eliminar procesos (DELETE)
-- ============================================

-- NOTA: Si quieres políticas más restrictivas (por ejemplo, solo 
-- permitir a los empleados asignados al proceso), puedes modificar
-- las políticas más adelante. Estas son políticas permisivas para
-- comenzar a trabajar rápidamente.
