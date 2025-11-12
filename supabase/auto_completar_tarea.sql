-- ============================================
-- FUNCIÓN PARA AUTO-COMPLETAR TAREAS
-- Actualiza fecha_completada automáticamente cuando el estado es "completada"
-- ============================================

-- Crear la función que se ejecutará en el trigger
CREATE OR REPLACE FUNCTION auto_completar_tarea()
RETURNS TRIGGER AS $$
DECLARE
  estado_nombre VARCHAR;
BEGIN
  -- Obtener el nombre del estado
  SELECT nombre INTO estado_nombre 
  FROM estados_tarea 
  WHERE id = NEW.estado_id;
  
  -- Si el estado es "completada" y no tiene fecha_completada, agregarla
  IF estado_nombre = 'completada' AND NEW.fecha_completada IS NULL THEN
    NEW.fecha_completada = NOW();
  END IF;
  
  -- Si el estado NO es "completada", limpiar fecha_completada
  IF estado_nombre != 'completada' AND NEW.fecha_completada IS NOT NULL THEN
    NEW.fecha_completada = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_auto_completar_tarea ON tareas;

-- Crear el trigger que se ejecuta ANTES de INSERT o UPDATE
CREATE TRIGGER trigger_auto_completar_tarea
  BEFORE INSERT OR UPDATE OF estado_id ON tareas
  FOR EACH ROW
  EXECUTE FUNCTION auto_completar_tarea();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_completar_tarea';
