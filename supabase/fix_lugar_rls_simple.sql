-- ============================================================
-- SOLUCIÓN RÁPIDA: Permitir lectura de tabla LUGAR
-- Ejecuta este SQL en Supabase Dashboard > SQL Editor
-- ============================================================

-- Opción 1: Deshabilitar RLS completamente (más simple)
ALTER TABLE lugar DISABLE ROW LEVEL SECURITY;

-- O si prefieres mantener RLS habilitado, usa estas políticas:
-- (Comenta la línea de arriba y descomenta las siguientes)

/*
-- Habilitar RLS
ALTER TABLE lugar ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "allow_read_lugar" ON lugar;
DROP POLICY IF EXISTS "allow_all_lugar" ON lugar;

-- Crear política que permite leer a todos los usuarios autenticados
CREATE POLICY "allow_read_lugar" ON lugar
    FOR SELECT
    TO authenticated
    USING (true);

-- O crear política que permite TODO a usuarios autenticados
CREATE POLICY "allow_all_lugar" ON lugar
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
*/

-- ============================================================
-- VERIFICAR que funcionó
-- ============================================================
SELECT * FROM lugar ORDER BY nombre;
