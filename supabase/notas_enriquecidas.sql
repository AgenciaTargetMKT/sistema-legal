-- =====================================================
-- SISTEMA DE NOTAS ENRIQUECIDAS ESTILO NOTION
-- =====================================================

-- Tabla para almacenar bloques de contenido de notas
CREATE TABLE IF NOT EXISTS notas_bloques (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'text', 'heading', 'image', 'list', 'code', 'quote', 'divider'
  contenido JSONB NOT NULL, -- Almacena el contenido según el tipo
  orden INTEGER NOT NULL DEFAULT 0,
  empleado_id UUID NOT NULL, -- Quién creó/modificó este bloque
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT notas_bloques_pkey PRIMARY KEY (id),
  CONSTRAINT notas_bloques_tarea_fkey FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  CONSTRAINT notas_bloques_empleado_fkey FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL,
  CONSTRAINT notas_bloques_tipo_check CHECK (
    tipo IN ('text', 'heading1', 'heading2', 'heading3', 'image', 'list', 'checklist', 'code', 'quote', 'divider', 'callout')
  )
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notas_bloques_tarea ON notas_bloques(tarea_id);
CREATE INDEX IF NOT EXISTS idx_notas_bloques_empleado ON notas_bloques(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notas_bloques_orden ON notas_bloques(tarea_id, orden);

-- Tabla para historial de cambios en notas
CREATE TABLE IF NOT EXISTS notas_historial (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  bloque_id UUID NOT NULL,
  tarea_id UUID NOT NULL,
  empleado_id UUID NOT NULL,
  accion VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  contenido_anterior JSONB,
  contenido_nuevo JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notas_historial_pkey PRIMARY KEY (id),
  CONSTRAINT notas_historial_bloque_fkey FOREIGN KEY (bloque_id) REFERENCES notas_bloques(id) ON DELETE CASCADE,
  CONSTRAINT notas_historial_tarea_fkey FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  CONSTRAINT notas_historial_empleado_fkey FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL,
  CONSTRAINT notas_historial_accion_check CHECK (accion IN ('created', 'updated', 'deleted'))
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_notas_historial_bloque ON notas_historial(bloque_id);
CREATE INDEX IF NOT EXISTS idx_notas_historial_tarea ON notas_historial(tarea_id);
CREATE INDEX IF NOT EXISTS idx_notas_historial_empleado ON notas_historial(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notas_historial_fecha ON notas_historial(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notas_bloques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notas_bloques_updated_at
  BEFORE UPDATE ON notas_bloques
  FOR EACH ROW
  EXECUTE FUNCTION update_notas_bloques_updated_at();

-- Trigger para registrar cambios en el historial
CREATE OR REPLACE FUNCTION registrar_cambio_nota()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notas_historial (bloque_id, tarea_id, empleado_id, accion, contenido_nuevo)
    VALUES (NEW.id, NEW.tarea_id, NEW.empleado_id, 'created', NEW.contenido);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.contenido IS DISTINCT FROM NEW.contenido THEN
      INSERT INTO notas_historial (bloque_id, tarea_id, empleado_id, accion, contenido_anterior, contenido_nuevo)
      VALUES (NEW.id, NEW.tarea_id, NEW.empleado_id, 'updated', OLD.contenido, NEW.contenido);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO notas_historial (bloque_id, tarea_id, empleado_id, accion, contenido_anterior)
    VALUES (OLD.id, OLD.tarea_id, OLD.empleado_id, 'deleted', OLD.contenido);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_cambio_nota
  AFTER INSERT OR UPDATE OR DELETE ON notas_bloques
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_nota();

-- RLS (Row Level Security)
ALTER TABLE notas_bloques ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_historial ENABLE ROW LEVEL SECURITY;

-- Políticas para notas_bloques
CREATE POLICY "Empleados pueden ver notas de tareas accesibles"
  ON notas_bloques FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      WHERE t.id = notas_bloques.tarea_id
      AND (
        t.empleado_creador_id = auth.uid() OR
        EXISTS (SELECT 1 FROM tareas_empleados_responsables ter WHERE ter.tarea_id = t.id AND ter.empleado_id IN (SELECT id FROM empleados WHERE auth_user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM tareas_empleados_designados ted WHERE ted.tarea_id = t.id AND ted.empleado_id IN (SELECT id FROM empleados WHERE auth_user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Empleados pueden crear notas en tareas accesibles"
  ON notas_bloques FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e ON e.auth_user_id = auth.uid()
      WHERE t.id = notas_bloques.tarea_id
      AND notas_bloques.empleado_id = e.id
    )
  );

CREATE POLICY "Empleados pueden actualizar sus propias notas"
  ON notas_bloques FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM empleados e
      WHERE e.auth_user_id = auth.uid()
      AND notas_bloques.empleado_id = e.id
    )
  );

CREATE POLICY "Empleados pueden eliminar sus propias notas"
  ON notas_bloques FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM empleados e
      WHERE e.auth_user_id = auth.uid()
      AND notas_bloques.empleado_id = e.id
    )
  );

-- Políticas para notas_historial (solo lectura)
CREATE POLICY "Empleados pueden ver historial de tareas accesibles"
  ON notas_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      WHERE t.id = notas_historial.tarea_id
      AND (
        t.empleado_creador_id = auth.uid() OR
        EXISTS (SELECT 1 FROM tareas_empleados_responsables ter WHERE ter.tarea_id = t.id AND ter.empleado_id IN (SELECT id FROM empleados WHERE auth_user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM tareas_empleados_designados ted WHERE ted.tarea_id = t.id AND ted.empleado_id IN (SELECT id FROM empleados WHERE auth_user_id = auth.uid()))
      )
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE notas_bloques IS 'Almacena bloques de contenido enriquecido estilo Notion para las notas de tareas';
COMMENT ON TABLE notas_historial IS 'Registra todos los cambios realizados en las notas, incluyendo quién y cuándo';
COMMENT ON COLUMN notas_bloques.contenido IS 'JSONB que almacena: {text: string, style: object, items: array, url: string, etc} según el tipo';
COMMENT ON COLUMN notas_bloques.tipo IS 'Tipo de bloque: text, heading1-3, image, list, checklist, code, quote, divider, callout';
