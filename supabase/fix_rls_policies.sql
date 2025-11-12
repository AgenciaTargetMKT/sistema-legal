-- ============================================
-- ARREGLO DE POLÍTICAS RLS
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "empleados_select" ON empleados;
DROP POLICY IF EXISTS "empleados_insert" ON empleados;
DROP POLICY IF EXISTS "empleados_update" ON empleados;
DROP POLICY IF EXISTS "empleados_delete" ON empleados;

-- 2. CREAR POLÍTICAS SIMPLES SIN RECURSIÓN
-- Los usuarios pueden ver su propio registro
CREATE POLICY "empleados_select_own"
ON empleados FOR SELECT
USING (auth.uid() = auth_user_id);

-- Los usuarios pueden actualizar su propio registro
CREATE POLICY "empleados_update_own"
ON empleados FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Solo admins pueden insertar nuevos empleados (sin recursión)
CREATE POLICY "empleados_insert_admin"
ON empleados FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM empleados e
    WHERE e.auth_user_id = auth.uid()
    AND e.rol_id IN (
      SELECT id FROM roles_empleados WHERE nombre = 'admin'
    )
  )
);

-- Solo admins pueden eliminar empleados (sin recursión)
CREATE POLICY "empleados_delete_admin"
ON empleados FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM empleados e
    WHERE e.auth_user_id = auth.uid()
    AND e.rol_id IN (
      SELECT id FROM roles_empleados WHERE nombre = 'admin'
    )
  )
);

-- 3. VERIFICAR QUE LAS POLÍTICAS SE CREARON
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'empleados'
ORDER BY policyname;

-- ============================================
-- ✅ Ahora deberías poder:
-- - Ver tu propio registro de empleado
-- - No tener errores de recursión infinita
-- ============================================
