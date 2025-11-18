-- =====================================================
-- MIGRACIÓN: Mejoras al sistema de tareas
-- Fecha: 2025-11-17
-- =====================================================

-- 1. Crear tabla para relación muchos-a-muchos: tareas-empleados designados
CREATE TABLE IF NOT EXISTS tareas_empleados_designados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tarea_id, empleado_id)
);

-- 2. Crear tabla para relación muchos-a-muchos: tareas-empleados responsables
CREATE TABLE IF NOT EXISTS tareas_empleados_responsables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tarea_id, empleado_id)
);

-- 3. Agregar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_empleados_designados_tarea ON tareas_empleados_designados(tarea_id);
CREATE INDEX IF NOT EXISTS idx_tareas_empleados_designados_empleado ON tareas_empleados_designados(empleado_id);
CREATE INDEX IF NOT EXISTS idx_tareas_empleados_responsables_tarea ON tareas_empleados_responsables(tarea_id);
CREATE INDEX IF NOT EXISTS idx_tareas_empleados_responsables_empleado ON tareas_empleados_responsables(empleado_id);

-- 4. Agregar nuevos campos a la tabla tareas
ALTER TABLE tareas 
  -- Agregar cliente_id (puede existir sin proceso)
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  
  -- Cambiar nombre de columna observaciones a notas
  ADD COLUMN IF NOT EXISTS notas TEXT,
  
  -- Agregar importancia (reemplaza prioridad)
  ADD COLUMN IF NOT EXISTS importancia VARCHAR(20) DEFAULT 'no importante' CHECK (importancia IN ('importante', 'no importante')),
  
  -- Agregar urgencia
  ADD COLUMN IF NOT EXISTS urgencia VARCHAR(20) DEFAULT 'no urgente' CHECK (urgencia IN ('urgente', 'no urgente')),
  
  -- Agregar empleado_creador_id para saber quién creó la tarea
  ADD COLUMN IF NOT EXISTS empleado_creador_id UUID REFERENCES empleados(id) ON DELETE SET NULL;

-- 5. Agregar índice para cliente_id
CREATE INDEX IF NOT EXISTS idx_tareas_cliente ON tareas(cliente_id);

-- 6. Migrar datos existentes
-- Copiar observaciones a notas
UPDATE tareas SET notas = observaciones WHERE notas IS NULL AND observaciones IS NOT NULL;

-- Migrar prioridad a importancia/urgencia
-- Urgente -> importante + urgente
UPDATE tareas SET 
  importancia = 'importante',
  urgencia = 'urgente'
WHERE prioridad = 'urgente';

-- Alta -> importante + urgente
UPDATE tareas SET 
  importancia = 'importante',
  urgencia = 'urgente'
WHERE prioridad = 'alta';

-- Media -> importante + no urgente
UPDATE tareas SET 
  importancia = 'importante',
  urgencia = 'no urgente'
WHERE prioridad = 'media';

-- Baja -> no importante + no urgente
UPDATE tareas SET 
  importancia = 'no importante',
  urgencia = 'no urgente'
WHERE prioridad = 'baja';

-- 7. Migrar empleado_asignado_id a la nueva tabla de designados
INSERT INTO tareas_empleados_designados (tarea_id, empleado_id)
SELECT id, empleado_asignado_id 
FROM tareas 
WHERE empleado_asignado_id IS NOT NULL
ON CONFLICT (tarea_id, empleado_id) DO NOTHING;

-- 8. Migrar empleado_asignado_id a responsables también (por defecto)
INSERT INTO tareas_empleados_responsables (tarea_id, empleado_id)
SELECT id, empleado_asignado_id 
FROM tareas 
WHERE empleado_asignado_id IS NOT NULL
ON CONFLICT (tarea_id, empleado_id) DO NOTHING;

-- 9. Políticas RLS para nuevas tablas
ALTER TABLE tareas_empleados_designados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_empleados_responsables ENABLE ROW LEVEL SECURITY;

-- Políticas para tareas_empleados_designados
CREATE POLICY "Los empleados pueden ver sus asignaciones"
  ON tareas_empleados_designados FOR SELECT
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Los empleados pueden crear asignaciones"
  ON tareas_empleados_designados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Los empleados pueden eliminar asignaciones"
  ON tareas_empleados_designados FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas para tareas_empleados_responsables
CREATE POLICY "Los empleados pueden ver responsables"
  ON tareas_empleados_responsables FOR SELECT
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Los empleados pueden crear responsables"
  ON tareas_empleados_responsables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Los empleados pueden eliminar responsables"
  ON tareas_empleados_responsables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM empleados WHERE auth_user_id = auth.uid()
    )
  );

-- 10. Crear función para obtener empleados designados
CREATE OR REPLACE FUNCTION get_empleados_designados(tarea_uuid UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR,
  apellido VARCHAR,
  email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nombre, e.apellido, e.email
  FROM empleados e
  INNER JOIN tareas_empleados_designados ted ON e.id = ted.empleado_id
  WHERE ted.tarea_id = tarea_uuid;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear función para obtener empleados responsables
CREATE OR REPLACE FUNCTION get_empleados_responsables(tarea_uuid UUID)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR,
  apellido VARCHAR,
  email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nombre, e.apellido, e.email
  FROM empleados e
  INNER JOIN tareas_empleados_responsables ter ON e.id = ter.empleado_id
  WHERE ter.tarea_id = tarea_uuid;
END;
$$ LANGUAGE plpgsql;

-- 12. Crear trigger para asignar automáticamente el creador como responsable
CREATE OR REPLACE FUNCTION set_creador_as_responsable()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se proporciona empleado_creador_id, agregarlo como responsable
  IF NEW.empleado_creador_id IS NOT NULL THEN
    INSERT INTO tareas_empleados_responsables (tarea_id, empleado_id)
    VALUES (NEW.id, NEW.empleado_creador_id)
    ON CONFLICT (tarea_id, empleado_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_creador_as_responsable
  AFTER INSERT ON tareas
  FOR EACH ROW
  EXECUTE FUNCTION set_creador_as_responsable();

-- 13. Comentarios descriptivos
COMMENT ON COLUMN tareas.cliente_id IS 'Cliente asociado a la tarea (puede existir sin proceso)';
COMMENT ON COLUMN tareas.notas IS 'Notas adicionales sobre la tarea (antes observaciones)';
COMMENT ON COLUMN tareas.importancia IS 'Nivel de importancia: importante o no importante';
COMMENT ON COLUMN tareas.urgencia IS 'Nivel de urgencia: urgente o no urgente';
COMMENT ON COLUMN tareas.empleado_creador_id IS 'Empleado que creó la tarea';

COMMENT ON TABLE tareas_empleados_designados IS 'Empleados designados para trabajar en la tarea';
COMMENT ON TABLE tareas_empleados_responsables IS 'Empleados responsables de la tarea';

-- =====================================================
-- NOTAS IMPORTANTES:
-- 
-- 1. NO se elimina la columna 'prioridad' por compatibilidad
--    pero se puede hacer manualmente después si se desea
-- 
-- 2. NO se elimina la columna 'empleado_asignado_id' 
--    por compatibilidad con código existente
-- 
-- 3. Las nuevas columnas 'importancia' y 'urgencia' tienen
--    valores por defecto
-- 
-- 4. El empleado creador se asigna automáticamente como
--    responsable cuando se crea una tarea
-- =====================================================
