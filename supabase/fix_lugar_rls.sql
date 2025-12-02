-- ============================================================
-- CONFIGURAR RLS PARA TABLA LUGAR
-- ============================================================

-- Verificar si la tabla lugar existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'lugar') THEN
        -- Crear la tabla si no existe
        CREATE TABLE lugar (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla lugar creada';
    END IF;
END $$;

-- Habilitar RLS en la tabla lugar
ALTER TABLE lugar ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Permitir lectura de lugares a todos los usuarios autenticados" ON lugar;
DROP POLICY IF EXISTS "Permitir inserción de lugares a admins" ON lugar;
DROP POLICY IF EXISTS "Permitir actualización de lugares a admins" ON lugar;
DROP POLICY IF EXISTS "Permitir eliminación de lugares a admins" ON lugar;
DROP POLICY IF EXISTS "lugar_select_policy" ON lugar;
DROP POLICY IF EXISTS "lugar_insert_policy" ON lugar;
DROP POLICY IF EXISTS "lugar_update_policy" ON lugar;
DROP POLICY IF EXISTS "lugar_delete_policy" ON lugar;

-- Política para permitir SELECT a todos los usuarios autenticados
CREATE POLICY "lugar_select_policy" ON lugar
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir INSERT a usuarios autenticados (opcional, solo admins)
CREATE POLICY "lugar_insert_policy" ON lugar
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre IN ('admin', 'superadmin')
        )
    );

-- Política para permitir UPDATE a admins
CREATE POLICY "lugar_update_policy" ON lugar
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre IN ('admin', 'superadmin')
        )
    );

-- Política para permitir DELETE a admins
CREATE POLICY "lugar_delete_policy" ON lugar
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre IN ('admin', 'superadmin')
        )
    );

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'lugar';

-- Verificar datos en la tabla
SELECT COUNT(*) as total_lugares FROM lugar;

