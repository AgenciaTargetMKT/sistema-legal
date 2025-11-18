-- =====================================================
-- REORGANIZACIÓN DE ESTADOS DE TAREAS
-- Actualización para seguir estructura de categorías
-- =====================================================

-- 1. PRIMERO: Agregar columna 'categoria' si no existe
ALTER TABLE estados_tarea ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);

-- 2. Eliminar estados existentes que no coinciden
DELETE FROM estados_tarea WHERE nombre IN ('bloqueada', 'cancelada');

-- 3. Actualizar estados existentes y agregar nuevos
-- Grupo: PENDIENTE
UPDATE estados_tarea SET 
  nombre = 'por_asignar',
  descripcion = 'Por asignar',
  color = '#6B7280',
  orden = 1,
  categoria = 'pendiente'
WHERE nombre = 'por_asignar';

UPDATE estados_tarea SET 
  nombre = 'sin_empezar',
  descripcion = 'Sin empezar',
  color = '#EF4444',
  orden = 2,
  categoria = 'pendiente'
WHERE nombre = 'sin_empezar';

-- Grupo: EN CURSO
-- Insertar NOTA (nuevo estado)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('nota', 'NOTA', '#F59E0B', 3, 'en_curso', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

UPDATE estados_tarea SET 
  nombre = 'en_curso',
  descripcion = 'En curso',
  color = '#3B82F6',
  orden = 4,
  categoria = 'en_curso'
WHERE nombre = 'en_curso';

-- Insertar Seguimiento (nuevo estado)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('seguimiento', 'Seguimiento', '#8B5CF6', 5, 'en_curso', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

UPDATE estados_tarea SET 
  nombre = 'para_revision',
  descripcion = 'Para revisión',
  color = '#EC4899',
  orden = 6,
  categoria = 'en_curso'
WHERE nombre = 'en_revision';

-- Insertar Pendiente info (nuevo estado)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('pendiente_info', 'Pendiente info', '#F97316', 7, 'en_curso', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

-- Insertar Pausada (nuevo estado)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('pausada', 'Pausada', '#9CA3AF', 8, 'en_curso', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

-- Grupo: COMPLETADO
UPDATE estados_tarea SET 
  nombre = 'finalizado',
  descripcion = 'Finalizado',
  color = '#10B981',
  orden = 9,
  categoria = 'completado'
WHERE nombre = 'completada';

-- Insertar Archivadas (nuevo estado)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('archivadas', 'Archivadas', '#6B7280', 10, 'completado', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

-- Grupo: VACÍO (estado especial para tareas sin clasificar)
INSERT INTO estados_tarea (nombre, descripcion, color, orden, categoria, activo)
VALUES ('vacio', 'Vacío', '#D1D5DB', 99, 'vacio', true)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden,
  categoria = EXCLUDED.categoria;

-- 4. Actualizar categorías para estados existentes (por si acaso)
UPDATE estados_tarea SET categoria = 'pendiente' WHERE orden IN (1, 2);
UPDATE estados_tarea SET categoria = 'en_curso' WHERE orden BETWEEN 3 AND 8;
UPDATE estados_tarea SET categoria = 'completado' WHERE orden IN (9, 10);
UPDATE estados_tarea SET categoria = 'vacio' WHERE orden = 99;

-- 5. Verificar resultado
SELECT 
  categoria,
  orden,
  nombre,
  descripcion,
  color,
  activo
FROM estados_tarea 
ORDER BY 
  CASE categoria
    WHEN 'pendiente' THEN 1
    WHEN 'en_curso' THEN 2
    WHEN 'completado' THEN 3
    WHEN 'vacio' THEN 4
  END,
  orden;

-- 6. Comentario en la tabla
COMMENT ON TABLE estados_tarea IS 'Estados de tareas organizados por categorías: Pendiente, En curso, Completado, Vacío - Actualizado 2025-11-17';
COMMENT ON COLUMN estados_tarea.categoria IS 'Categoría del estado: pendiente, en_curso, completado, vacio';
