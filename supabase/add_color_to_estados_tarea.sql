-- ============================================
-- AGREGAR CAMPO COLOR A ESTADOS_TAREA
-- (Si no existe ya)
-- ============================================

-- Verificar si la columna 'color' existe en estados_tarea
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='estados_tarea' AND column_name='color'
    ) THEN
        ALTER TABLE estados_tarea ADD COLUMN color VARCHAR(20);
        
        -- Actualizar con colores por defecto
        UPDATE estados_tarea SET color = '#10B981' WHERE nombre = 'completada';
        UPDATE estados_tarea SET color = '#F59E0B' WHERE nombre = 'en_curso';
        UPDATE estados_tarea SET color = '#EF4444' WHERE nombre = 'bloqueada';
        UPDATE estados_tarea SET color = '#6B7280' WHERE nombre = 'pendiente';
        
        RAISE NOTICE 'Columna "color" agregada a estados_tarea';
    ELSE
        RAISE NOTICE 'La columna "color" ya existe en estados_tarea';
    END IF;
END $$;

-- ============================================
-- INSERTAR ESTADOS POR DEFECTO CON COLORES
-- (Solo si no existen)
-- ============================================

INSERT INTO estados_tarea (nombre, descripcion, color, orden, activo)
VALUES 
  ('pendiente', 'Tarea pendiente de iniciar', '#6B7280', 1, true),
  ('en_curso', 'Tarea en progreso', '#F59E0B', 2, true),
  ('bloqueada', 'Tarea bloqueada', '#EF4444', 3, true),
  ('completada', 'Tarea completada', '#10B981', 4, true)
ON CONFLICT (nombre) DO UPDATE SET
  color = EXCLUDED.color,
  descripcion = EXCLUDED.descripcion;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT id, nombre, color, orden, activo 
FROM estados_tarea 
ORDER BY orden;
