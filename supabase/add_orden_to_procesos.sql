-- Agregar campo 'orden' a la tabla procesos para permitir ordenamiento manual

-- 1. Agregar la columna 'orden' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'procesos' 
        AND column_name = 'orden'
    ) THEN
        ALTER TABLE procesos ADD COLUMN orden INTEGER;
        
        -- Asignar números de orden basados en el orden actual
        WITH ordenado AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS nuevo_orden
            FROM procesos
        )
        UPDATE procesos 
        SET orden = ordenado.nuevo_orden
        FROM ordenado
        WHERE procesos.id = ordenado.id;
        
        -- Hacer que orden no pueda ser nulo (después de asignar valores)
        ALTER TABLE procesos ALTER COLUMN orden SET NOT NULL;
        
        -- Agregar un valor por defecto para nuevos registros
        ALTER TABLE procesos ALTER COLUMN orden SET DEFAULT 0;
        
        RAISE NOTICE 'Columna orden agregada exitosamente a la tabla procesos';
    ELSE
        RAISE NOTICE 'La columna orden ya existe en la tabla procesos';
    END IF;
END $$;

-- 2. Crear índice para mejor performance en ordenamiento
CREATE INDEX IF NOT EXISTS idx_procesos_orden ON procesos(orden);

-- Verificación
SELECT 
    id,
    numero_proceso,
    nombre,
    orden
FROM procesos
ORDER BY orden
LIMIT 10;
