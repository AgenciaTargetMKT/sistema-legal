-- ============================================
-- Fix: Permitir que todos los empleados puedan ver a todos los empleados
-- Problema: Actualmente solo pueden verse a sí mismos o si son admin
-- Solución: Cualquier usuario autenticado puede ver todos los empleados
-- ============================================

-- Primero, eliminamos la política actual
DROP POLICY IF EXISTS empleados_policy ON empleados;

-- Creamos una nueva política que permite a cualquier empleado autenticado ver todos los empleados
CREATE POLICY empleados_select_policy ON empleados
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL  -- Cualquier usuario autenticado puede ver todos los empleados
    );

-- Política para INSERT: Solo admins pueden crear empleados
CREATE POLICY empleados_insert_policy ON empleados
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre = 'admin'
        )
    );

-- Política para UPDATE: Los empleados pueden actualizar su propio registro, o los admins pueden actualizar cualquiera
CREATE POLICY empleados_update_policy ON empleados
    FOR UPDATE
    USING (
        auth.uid() = auth_user_id OR 
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre = 'admin'
        )
    );

-- Política para DELETE: Solo admins pueden eliminar empleados
CREATE POLICY empleados_delete_policy ON empleados
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre = 'admin'
        )
    );

-- Verificar que las políticas se aplicaron correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'empleados'
ORDER BY policyname;
