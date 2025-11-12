-- ============================================
-- POLÍTICAS RLS PARA TABLA CLIENTES
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON clientes;

-- 2. VERIFICAR QUE RLS ESTÁ HABILITADO
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS NUEVAS
-- Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "clientes_select_authenticated"
ON clientes FOR SELECT
TO authenticated
USING (true);

-- Todos los usuarios autenticados pueden crear clientes
CREATE POLICY "clientes_insert_authenticated"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Todos los usuarios autenticados pueden actualizar clientes
CREATE POLICY "clientes_update_authenticated"
ON clientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Solo admins pueden eliminar clientes
CREATE POLICY "clientes_delete_authenticated"
ON clientes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empleados e
    JOIN roles_empleados r ON e.rol_id = r.id
    WHERE e.auth_user_id = auth.uid()
    AND r.nombre = 'admin'
  )
);

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clientes'
ORDER BY policyname;

-- ============================================
-- ✅ Resultado esperado:
-- - clientes_select_authenticated (SELECT)
-- - clientes_insert_authenticated (INSERT)
-- - clientes_update_authenticated (UPDATE)
-- - clientes_delete_authenticated (DELETE)
-- ============================================
