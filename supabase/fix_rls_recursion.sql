-- ============================================
-- SOLUCIÓN DEFINITIVA PARA RECURSIÓN INFINITA EN RLS
-- Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- PASO 1: DESACTIVAR RLS TEMPORALMENTE PARA LIMPIAR
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "empleados_select" ON empleados;
DROP POLICY IF EXISTS "empleados_insert" ON empleados;
DROP POLICY IF EXISTS "empleados_update" ON empleados;
DROP POLICY IF EXISTS "empleados_delete" ON empleados;
DROP POLICY IF EXISTS "empleados_select_own" ON empleados;
DROP POLICY IF EXISTS "empleados_update_own" ON empleados;
DROP POLICY IF EXISTS "empleados_insert_admin" ON empleados;
DROP POLICY IF EXISTS "empleados_delete_admin" ON empleados;
DROP POLICY IF EXISTS "Empleados pueden ver su propia información" ON empleados;
DROP POLICY IF EXISTS "Admins pueden ver todos los empleados" ON empleados;
DROP POLICY IF EXISTS "Empleados pueden actualizar su propia información" ON empleados;
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier empleado" ON empleados;
DROP POLICY IF EXISTS "Admins pueden insertar nuevos empleados" ON empleados;
DROP POLICY IF EXISTS "Admins pueden eliminar empleados" ON empleados;

-- PASO 3: CREAR FUNCIÓN AUXILIAR SIN RECURSIÓN
-- Esta función verifica si el usuario es admin usando directamente auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM empleados e
    INNER JOIN roles_empleados r ON e.rol_id = r.id
    WHERE e.auth_user_id = auth.uid()
    AND r.nombre = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 4: REACTIVAR RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- PASO 5: CREAR POLÍTICAS SIMPLES Y SIN RECURSIÓN

-- SELECT: Los usuarios pueden ver su propio registro O si son admin pueden ver todos
CREATE POLICY "empleados_select_policy"
ON empleados FOR SELECT
USING (
  auth_user_id = auth.uid()  -- Ver su propio registro
  OR 
  is_admin()  -- O es admin (sin recursión porque la función es SECURITY DEFINER)
);

-- INSERT: Solo admins pueden insertar
CREATE POLICY "empleados_insert_policy"
ON empleados FOR INSERT
WITH CHECK (is_admin());

-- UPDATE: Usuarios pueden actualizar su propio registro O admins pueden actualizar cualquiera
CREATE POLICY "empleados_update_policy"
ON empleados FOR UPDATE
USING (
  auth_user_id = auth.uid()
  OR 
  is_admin()
);

-- DELETE: Solo admins pueden eliminar
CREATE POLICY "empleados_delete_policy"
ON empleados FOR DELETE
USING (is_admin());

-- PASO 6: POLÍTICAS PARA OTRAS TABLAS (sin recursión)

-- PROCESOS
DROP POLICY IF EXISTS "procesos_select" ON procesos;
DROP POLICY IF EXISTS "procesos_insert" ON procesos;
DROP POLICY IF EXISTS "procesos_update" ON procesos;
DROP POLICY IF EXISTS "procesos_delete" ON procesos;

CREATE POLICY "procesos_select_policy"
ON procesos FOR SELECT
USING (true); -- Todos los usuarios autenticados pueden ver procesos

CREATE POLICY "procesos_insert_policy"
ON procesos FOR INSERT
WITH CHECK (true); -- Todos los usuarios autenticados pueden crear procesos

CREATE POLICY "procesos_update_policy"
ON procesos FOR UPDATE
USING (true); -- Todos los usuarios autenticados pueden actualizar procesos

CREATE POLICY "procesos_delete_policy"
ON procesos FOR DELETE
USING (is_admin()); -- Solo admins pueden eliminar

-- CLIENTES
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;

CREATE POLICY "clientes_select_policy"
ON clientes FOR SELECT
USING (true);

CREATE POLICY "clientes_insert_policy"
ON clientes FOR INSERT
WITH CHECK (true);

CREATE POLICY "clientes_update_policy"
ON clientes FOR UPDATE
USING (true);

CREATE POLICY "clientes_delete_policy"
ON clientes FOR DELETE
USING (is_admin());

-- TAREAS
DROP POLICY IF EXISTS "tareas_select" ON tareas;
DROP POLICY IF EXISTS "tareas_insert" ON tareas;
DROP POLICY IF EXISTS "tareas_update" ON tareas;
DROP POLICY IF EXISTS "tareas_delete" ON tareas;

CREATE POLICY "tareas_select_policy"
ON tareas FOR SELECT
USING (true);

CREATE POLICY "tareas_insert_policy"
ON tareas FOR INSERT
WITH CHECK (true);

CREATE POLICY "tareas_update_policy"
ON tareas FOR UPDATE
USING (true);

CREATE POLICY "tareas_delete_policy"
ON tareas FOR DELETE
USING (true);

-- IMPULSOS
DROP POLICY IF EXISTS "impulsos_select" ON impulsos;
DROP POLICY IF EXISTS "impulsos_insert" ON impulsos;
DROP POLICY IF EXISTS "impulsos_update" ON impulsos;
DROP POLICY IF EXISTS "impulsos_delete" ON impulsos;

CREATE POLICY "impulsos_select_policy"
ON impulsos FOR SELECT
USING (true);

CREATE POLICY "impulsos_insert_policy"
ON impulsos FOR INSERT
WITH CHECK (true);

CREATE POLICY "impulsos_update_policy"
ON impulsos FOR UPDATE
USING (true);

CREATE POLICY "impulsos_delete_policy"
ON impulsos FOR DELETE
USING (true);

-- PASO 7: VERIFICACIÓN
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ✅ RESULTADO ESPERADO:
-- - Sin errores de recursión infinita
-- - Los usuarios pueden ver su propia información
-- - Los admins pueden gestionar todo
-- - El resto de tablas son accesibles por todos los usuarios autenticados
-- ============================================
