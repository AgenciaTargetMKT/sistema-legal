-- ============================================
-- POLÍTICAS RLS PARA TABLA TAREAS
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "tareas_select" ON tareas;
DROP POLICY IF EXISTS "tareas_insert" ON tareas;
DROP POLICY IF EXISTS "tareas_update" ON tareas;
DROP POLICY IF EXISTS "tareas_delete" ON tareas;
DROP POLICY IF EXISTS "tareas_select_policy" ON tareas;
DROP POLICY IF EXISTS "tareas_insert_policy" ON tareas;
DROP POLICY IF EXISTS "tareas_update_policy" ON tareas;
DROP POLICY IF EXISTS "tareas_delete_policy" ON tareas;

-- 2. VERIFICAR QUE RLS ESTÁ HABILITADO
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS NUEVAS
-- Todos los usuarios autenticados pueden ver tareas
CREATE POLICY "tareas_select_authenticated"
ON tareas FOR SELECT
TO authenticated
USING (true);

-- Todos los usuarios autenticados pueden crear tareas
CREATE POLICY "tareas_insert_authenticated"
ON tareas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Todos los usuarios autenticados pueden actualizar tareas
CREATE POLICY "tareas_update_authenticated"
ON tareas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Todos los usuarios autenticados pueden eliminar tareas
CREATE POLICY "tareas_delete_authenticated"
ON tareas FOR DELETE
TO authenticated
USING (true);

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tareas'
ORDER BY policyname;

-- ============================================
-- ✅ Resultado esperado:
-- - tareas_select_authenticated (SELECT)
-- - tareas_insert_authenticated (INSERT)
-- - tareas_update_authenticated (UPDATE)
-- - tareas_delete_authenticated (DELETE)
-- ============================================
