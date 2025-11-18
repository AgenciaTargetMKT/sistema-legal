-- =====================================================
-- LIMPIEZA OPCIONAL: Eliminar columnas antiguas
-- EJECUTAR SOLO DESPUÉS DE VERIFICAR QUE TODO FUNCIONA
-- =====================================================

-- ADVERTENCIA: Este script elimina columnas permanentemente
-- Asegúrate de hacer un respaldo antes de ejecutar

-- 1. Eliminar columna prioridad (ya reemplazada por importancia/urgencia)
ALTER TABLE tareas DROP COLUMN IF EXISTS prioridad;

-- 2. Eliminar columna empleado_asignado_id (ya reemplazada por tablas de relación)
ALTER TABLE tareas DROP COLUMN IF EXISTS empleado_asignado_id;

-- 3. Eliminar columna observaciones (ya reemplazada por notas)
ALTER TABLE tareas DROP COLUMN IF EXISTS observaciones;

-- 4. Verificación de estructura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tareas' 
ORDER BY ordinal_position;

COMMENT ON TABLE tareas IS 'Tabla principal de tareas - Actualizada 2025-11-17';
