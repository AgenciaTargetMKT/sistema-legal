-- =====================================================
-- SISTEMA DE NOTAS CON BLOCKNOTE
-- =====================================================
-- Este script crea una estructura simplificada para almacenar
-- documentos de BlockNote como JSON

-- Tabla para almacenar las notas de cada tarea
CREATE TABLE IF NOT EXISTS notas_tarea (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL UNIQUE, -- Una nota por tarea
  contenido JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de bloques de BlockNote
  empleado_modificado_id UUID, -- Último empleado que modificó
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notas_tarea_pkey PRIMARY KEY (id),
  CONSTRAINT notas_tarea_tarea_fkey FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  CONSTRAINT notas_tarea_empleado_fkey FOREIGN KEY (empleado_modificado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notas_tarea_tarea ON notas_tarea(tarea_id);
CREATE INDEX IF NOT EXISTS idx_notas_tarea_empleado ON notas_tarea(empleado_modificado_id);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_notas_tarea_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_notas_tarea_updated_at_trigger ON notas_tarea;
CREATE TRIGGER update_notas_tarea_updated_at_trigger
  BEFORE UPDATE ON notas_tarea
  FOR EACH ROW
  EXECUTE FUNCTION update_notas_tarea_updated_at();

-- Tabla para historial de cambios (opcional - para auditoría)
CREATE TABLE IF NOT EXISTS notas_tarea_historial (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nota_id UUID NOT NULL,
  tarea_id UUID NOT NULL,
  empleado_id UUID NOT NULL,
  contenido_anterior JSONB,
  contenido_nuevo JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notas_tarea_historial_pkey PRIMARY KEY (id),
  CONSTRAINT notas_tarea_historial_nota_fkey FOREIGN KEY (nota_id) REFERENCES notas_tarea(id) ON DELETE CASCADE,
  CONSTRAINT notas_tarea_historial_tarea_fkey FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  CONSTRAINT notas_tarea_historial_empleado_fkey FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_notas_tarea_historial_nota ON notas_tarea_historial(nota_id);
CREATE INDEX IF NOT EXISTS idx_notas_tarea_historial_tarea ON notas_tarea_historial(tarea_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE notas_tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_tarea_historial ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver notas de tareas que pueden ver
CREATE POLICY "Los usuarios pueden ver notas de sus tareas"
  ON notas_tarea
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e_creador ON e_creador.id = t.empleado_creador_id
      WHERE t.id = notas_tarea.tarea_id
      AND (
        -- Usuario autenticado puede ver tareas donde es responsable, designado o creador
        e_creador.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_responsables ter
          JOIN empleados e ON e.id = ter.empleado_id
          WHERE ter.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_designados ted
          JOIN empleados e ON e.id = ted.empleado_id
          WHERE ted.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Los usuarios pueden crear notas para tareas que pueden ver
CREATE POLICY "Los usuarios pueden crear notas para sus tareas"
  ON notas_tarea
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e_creador ON e_creador.id = t.empleado_creador_id
      WHERE t.id = notas_tarea.tarea_id
      AND (
        e_creador.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_responsables ter
          JOIN empleados e ON e.id = ter.empleado_id
          WHERE ter.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_designados ted
          JOIN empleados e ON e.id = ted.empleado_id
          WHERE ted.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Los usuarios pueden actualizar notas de tareas que pueden ver
CREATE POLICY "Los usuarios pueden actualizar notas de sus tareas"
  ON notas_tarea
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e_creador ON e_creador.id = t.empleado_creador_id
      WHERE t.id = notas_tarea.tarea_id
      AND (
        e_creador.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_responsables ter
          JOIN empleados e ON e.id = ter.empleado_id
          WHERE ter.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_designados ted
          JOIN empleados e ON e.id = ted.empleado_id
          WHERE ted.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Los usuarios pueden eliminar notas de tareas que pueden ver
CREATE POLICY "Los usuarios pueden eliminar notas de sus tareas"
  ON notas_tarea
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e_creador ON e_creador.id = t.empleado_creador_id
      WHERE t.id = notas_tarea.tarea_id
      AND (
        e_creador.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_responsables ter
          JOIN empleados e ON e.id = ter.empleado_id
          WHERE ter.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_designados ted
          JOIN empleados e ON e.id = ted.empleado_id
          WHERE ted.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
      )
    )
  );

-- Policy para historial: Los usuarios pueden ver el historial de sus tareas
CREATE POLICY "Los usuarios pueden ver historial de sus notas"
  ON notas_tarea_historial
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tareas t
      JOIN empleados e_creador ON e_creador.id = t.empleado_creador_id
      WHERE t.id = notas_tarea_historial.tarea_id
      AND (
        e_creador.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_responsables ter
          JOIN empleados e ON e.id = ter.empleado_id
          WHERE ter.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM tareas_empleados_designados ted
          JOIN empleados e ON e.id = ted.empleado_id
          WHERE ted.tarea_id = t.id AND e.auth_user_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE notas_tarea IS 'Almacena las notas de cada tarea en formato BlockNote JSON';
COMMENT ON COLUMN notas_tarea.contenido IS 'Array de bloques de BlockNote en formato JSON - ver https://www.blocknotejs.org/docs/foundations/document-structure';
COMMENT ON COLUMN notas_tarea.empleado_modificado_id IS 'ID del último empleado que modificó las notas';

COMMENT ON TABLE notas_tarea_historial IS 'Historial de cambios en las notas para auditoría';
