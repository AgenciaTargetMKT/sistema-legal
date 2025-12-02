-- =====================================================
-- AGREGAR COLORES A CATÁLOGOS
-- =====================================================

-- 1. Agregar columna color a tipos_proceso (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tipos_proceso' AND column_name = 'color') THEN
        ALTER TABLE tipos_proceso ADD COLUMN color VARCHAR(7);
    END IF;
END $$;

-- 2. Agregar columna color a roles_cliente (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles_cliente' AND column_name = 'color') THEN
        ALTER TABLE roles_cliente ADD COLUMN color VARCHAR(7);
    END IF;
END $$;

-- 3. Agregar columna color a materias (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'materias' AND column_name = 'color') THEN
        ALTER TABLE materias ADD COLUMN color VARCHAR(7);
    END IF;
END $$;

-- =====================================================
-- ASIGNAR COLORES A TIPOS DE PROCESO
-- =====================================================
UPDATE tipos_proceso SET color = '#3B82F6' WHERE nombre = 'P.Administrativo';  -- Azul
UPDATE tipos_proceso SET color = '#EF4444' WHERE nombre = 'P.Judicial';         -- Rojo
UPDATE tipos_proceso SET color = '#8B5CF6' WHERE nombre = 'Convenio Arbitral';  -- Violeta

-- =====================================================
-- ASIGNAR COLORES A ROLES DE CLIENTE
-- =====================================================
UPDATE roles_cliente SET color = '#6B7280' WHERE nombre = 'Testigo';        -- Gris
UPDATE roles_cliente SET color = '#10B981' WHERE nombre = 'Demandante';     -- Verde
UPDATE roles_cliente SET color = '#EF4444' WHERE nombre = 'Demandado';      -- Rojo
UPDATE roles_cliente SET color = '#3B82F6' WHERE nombre = 'Denunciante';    -- Azul
UPDATE roles_cliente SET color = '#F59E0B' WHERE nombre = 'Denunciado';     -- Ámbar
UPDATE roles_cliente SET color = '#06B6D4' WHERE nombre = 'Administrado';   -- Cyan
UPDATE roles_cliente SET color = '#8B5CF6' WHERE nombre = 'Solicitante';    -- Violeta

-- =====================================================
-- ASIGNAR COLORES A MATERIAS
-- =====================================================
UPDATE materias SET color = '#F59E0B' WHERE nombre = 'Multa adm.';              -- Ámbar
UPDATE materias SET color = '#3B82F6' WHERE nombre = 'CIVIL - ODSD';            -- Azul
UPDATE materias SET color = '#8B5CF6' WHERE nombre = 'ACA';                     -- Violeta
UPDATE materias SET color = '#10B981' WHERE nombre = 'LABORAL';                 -- Verde
UPDATE materias SET color = '#06B6D4' WHERE nombre = 'CIVIl';                   -- Cyan
UPDATE materias SET color = '#EF4444' WHERE nombre = 'Penal';                   -- Rojo
UPDATE materias SET color = '#EC4899' WHERE nombre = 'Arbitraje';               -- Rosa
UPDATE materias SET color = '#F97316' WHERE nombre = 'Denuncia Administrativa'; -- Naranja
UPDATE materias SET color = '#84CC16' WHERE nombre = 'Rectificación de partida';-- Lima
UPDATE materias SET color = '#6366F1' WHERE nombre = 'Procedimiento Adm.';      -- Indigo
UPDATE materias SET color = '#14B8A6' WHERE nombre = 'DEUDA TRIBUTARIA';        -- Teal

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================
SELECT 'tipos_proceso' as tabla, nombre, color FROM tipos_proceso ORDER BY nombre;
SELECT 'roles_cliente' as tabla, nombre, color FROM roles_cliente ORDER BY nombre;
SELECT 'materias' as tabla, nombre, color FROM materias ORDER BY nombre;
