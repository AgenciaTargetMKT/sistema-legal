-- ============================================
-- ELIMINAR COLUMNAS DE GESTIÓN DE TIEMPO
-- Opcional: Solo ejecutar si deseas eliminar estas columnas de la base de datos
-- ============================================

-- ADVERTENCIA: Esta acción es IRREVERSIBLE
-- Se perderán los datos de tiempo_estimado y tiempo_real
-- Hacer backup antes de ejecutar

BEGIN;

-- Eliminar columnas de tiempo
ALTER TABLE tareas DROP COLUMN IF EXISTS tiempo_estimado;
ALTER TABLE tareas DROP COLUMN IF EXISTS tiempo_real;

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las columnas fueron eliminadas
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'tareas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- ROLLBACK (si es necesario)
-- ============================================

-- Si necesitas restaurar las columnas, ejecuta:
/*
BEGIN;

ALTER TABLE tareas ADD COLUMN tiempo_estimado INTEGER NULL;
ALTER TABLE tareas ADD COLUMN tiempo_real INTEGER NULL;

COMMIT;
*/
