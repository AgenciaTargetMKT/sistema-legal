-- ============================================
-- CONFIGURACIÓN COMPLETA PARA TAREAS
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- PARTE 1: POLÍTICAS RLS
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

-- PARTE 2: CAMPO ORDEN
-- ============================================

-- 1. Agregar columna orden si no existe
ALTER TABLE tareas 
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

-- 2. Actualizar el orden de tareas existentes basado en fecha de creación
WITH numbered_tareas AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as new_orden
  FROM tareas
)
UPDATE tareas
SET orden = numbered_tareas.new_orden
FROM numbered_tareas
WHERE tareas.id = numbered_tareas.id;

-- 3. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_orden ON tareas(orden);

-- PARTE 3: VERIFICACIÓN
-- ============================================

-- Verificar políticas
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

-- Verificar campo orden
SELECT id, nombre, orden, created_at 
FROM tareas 
ORDER BY orden 
LIMIT 10;

-- ============================================
-- ✅ Resultado esperado:
-- POLÍTICAS:
-- - tareas_select_authenticated (SELECT)
-- - tareas_insert_authenticated (INSERT)
-- - tareas_update_authenticated (UPDATE)
-- - tareas_delete_authenticated (DELETE)
--
-- CAMPO ORDEN:
-- - Todas las tareas deben tener un valor en la columna orden
-- ============================================
