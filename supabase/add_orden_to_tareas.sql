-- ============================================
-- AGREGAR CAMPO ORDEN A TABLA TAREAS
-- Ejecuta este script en Supabase SQL Editor
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

-- 4. Verificar
SELECT id, nombre, orden, created_at 
FROM tareas 
ORDER BY orden 
LIMIT 10;

-- ============================================
-- ✅ Ahora la tabla tareas tiene un campo orden
-- ============================================
