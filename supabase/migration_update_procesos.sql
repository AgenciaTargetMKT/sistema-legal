-- ============================================================
-- MIGRACIÓN: ACTUALIZACIÓN DE TABLA PROCESOS
-- Fecha: 12 de noviembre de 2025
-- Descripción: Ajustar campos según requerimientos actuales
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR CAMPOS QUE YA NO SE NECESITAN
-- ============================================================

-- Eliminar fecha_recordatorio (no está en los requerimientos)
ALTER TABLE procesos DROP COLUMN IF EXISTS fecha_recordatorio;

-- Eliminar fecha_inicio (no está en los requerimientos)
ALTER TABLE procesos DROP COLUMN IF EXISTS fecha_inicio;

-- Eliminar fecha_conclusion (no está en los requerimientos)
ALTER TABLE procesos DROP COLUMN IF EXISTS fecha_conclusion;

-- Eliminar observaciones (se puede usar el campo de actualizaciones)
ALTER TABLE procesos DROP COLUMN IF EXISTS observaciones;

-- Eliminar activo (se usa estado_general para esto)
ALTER TABLE procesos DROP COLUMN IF EXISTS activo;

-- ============================================================
-- PASO 2: MODIFICAR CAMPOS EXISTENTES
-- ============================================================

-- Renombrar 'contra_parte' a 'contraparte' solo si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'procesos' 
        AND column_name = 'contra_parte'
    ) THEN
        ALTER TABLE procesos RENAME COLUMN contra_parte TO contraparte;
    END IF;
END $$;

-- Asegurar que numero_proceso ya NO existe (fue eliminado anteriormente)
-- Si existe, eliminarlo
ALTER TABLE procesos DROP COLUMN IF EXISTS numero_proceso;

-- Si 'contraparte' no existe, crearlo
ALTER TABLE procesos ADD COLUMN IF NOT EXISTS contraparte VARCHAR(255);

-- ============================================================
-- PASO 3: AGREGAR CAMPOS NUEVOS O FALTANTES
-- ============================================================

-- Agregar 'lugar' si no existe
ALTER TABLE procesos ADD COLUMN IF NOT EXISTS lugar VARCHAR(255);

-- Agregar 'ultima_actuacion_esperada' (texto descriptivo)
ALTER TABLE procesos ADD COLUMN IF NOT EXISTS ultima_actuacion_esperada TEXT;

-- Agregar 'orden' para ordenamiento manual (si no existe)
ALTER TABLE procesos ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;

-- ============================================================
-- PASO 4: ELIMINAR responsable_id SI EXISTE (usar proceso_empleados en su lugar)
-- ============================================================

-- Eliminar el constraint si existe
ALTER TABLE procesos DROP CONSTRAINT IF EXISTS fk_procesos_responsable;

-- Eliminar la columna responsable_id (usar proceso_empleados con rol='responsable')
ALTER TABLE procesos DROP COLUMN IF EXISTS responsable_id;

-- ============================================================
-- PASO 5: ASEGURAR INTEGRIDAD DE TABLA proceso_empleados
-- ============================================================

-- La tabla proceso_empleados ya existe y debe usarse para asignar empleados
-- El campo 'rol' indica si es 'responsable', 'asistente', 'consultor', etc.
-- 
-- NOTA: Para identificar al responsable de un proceso, usar:
-- SELECT * FROM proceso_empleados WHERE proceso_id = ? AND rol = 'responsable' AND activo = true;

-- ============================================================
-- PASO 5: ASEGURAR INTEGRIDAD DE TABLA proceso_empleados
-- ============================================================

-- La tabla proceso_empleados ya existe y debe usarse para asignar empleados
-- El campo 'rol' indica si es 'responsable', 'asistente', 'consultor', etc.
-- 
-- NOTA: Para identificar al responsable de un proceso, usar:
-- SELECT * FROM proceso_empleados WHERE proceso_id = ? AND rol = 'responsable' AND activo = true;

-- ============================================================
-- PASO 6: CREAR/ACTUALIZAR ÍNDICES
-- ============================================================

-- Índices básicos (mantener los existentes)
CREATE INDEX IF NOT EXISTS idx_procesos_cliente_id ON procesos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_procesos_estado_id ON procesos(estado_id);
CREATE INDEX IF NOT EXISTS idx_procesos_materia_id ON procesos(materia_id);
CREATE INDEX IF NOT EXISTS idx_procesos_tipo_id ON procesos(tipo_proceso_id);
CREATE INDEX IF NOT EXISTS idx_procesos_estado_general ON procesos(estado_general);
CREATE INDEX IF NOT EXISTS idx_procesos_impulso ON procesos(impulso);
CREATE INDEX IF NOT EXISTS idx_procesos_orden ON procesos(orden);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_procesos_fecha_proximo_contacto ON procesos(fecha_proximo_contacto);
CREATE INDEX IF NOT EXISTS idx_procesos_rol_cliente_id ON procesos(rol_cliente_id);

-- Índices en proceso_empleados para optimizar búsquedas de responsables
CREATE INDEX IF NOT EXISTS idx_proceso_empleados_rol ON proceso_empleados(rol);
CREATE INDEX IF NOT EXISTS idx_proceso_empleados_activo ON proceso_empleados(activo);
CREATE INDEX IF NOT EXISTS idx_proceso_empleados_rol_activo ON proceso_empleados(rol, activo);

-- ============================================================
-- PASO 7: VERIFICAR ESTRUCTURA FINAL
-- ============================================================

-- La tabla procesos debe quedar con los siguientes campos:
-- 
-- CAMPOS PRINCIPALES:
-- - id (UUID, PK)
-- - nombre (VARCHAR 255) - Nombre del proceso
-- - cliente_id (UUID, FK) - ID del cliente
-- - rol_cliente_id (UUID, FK) - Rol del cliente (demandante, demandado, etc.)
-- - contraparte (VARCHAR 255) - Contra quién es el caso (la otra parte)
-- - materia_id (UUID, FK) - Materia legal
-- - dependencia (VARCHAR 255) - Juzgado, entidad administrativa, etc.
-- - lugar (VARCHAR 255) - Ubicación física del proceso
-- - tipo_proceso_id (UUID, FK) - Tipo: administrativo, judicial, etc.
-- - estado_id (UUID, FK) - Estado actual del proceso
-- - estado_general (VARCHAR 50) - activo, pausado, archivado
-- - pretensiones (TEXT) - Pretensiones del caso
-- - impulso (BOOLEAN) - Si necesita impulso
-- - ultima_actualizacion_id (UUID, FK) - Última actualización registrada
-- - ultima_actuacion_esperada (TEXT) - Descripción de próxima acción esperada
-- - fecha_proximo_contacto (DATE) - Fecha del próximo contacto
-- - orden (INTEGER) - Orden manual para ordenamiento
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
--
-- NOTA IMPORTANTE: Los empleados asignados se manejan en la tabla proceso_empleados
-- Para obtener el responsable: SELECT * FROM proceso_empleados WHERE proceso_id = ? AND rol = 'responsable'

-- ============================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================

COMMENT ON COLUMN procesos.nombre IS 'Nombre descriptivo del proceso legal';
COMMENT ON COLUMN procesos.cliente_id IS 'Cliente principal del caso';
COMMENT ON COLUMN procesos.rol_cliente_id IS 'Rol del cliente: demandante, demandado, querellante, etc.';
COMMENT ON COLUMN procesos.contraparte IS 'La otra parte del caso (contra quién/quiénes)';
COMMENT ON COLUMN procesos.materia_id IS 'Materia legal: civil, penal, laboral, etc.';
COMMENT ON COLUMN procesos.dependencia IS 'Juzgado, entidad administrativa u organismo donde se tramita';
COMMENT ON COLUMN procesos.lugar IS 'Ubicación física del proceso';
COMMENT ON COLUMN procesos.tipo_proceso_id IS 'Tipo de proceso: judicial, administrativo, etc.';
COMMENT ON COLUMN procesos.estado_id IS 'Estado específico del proceso según catálogo';
COMMENT ON COLUMN procesos.estado_general IS 'Estado general: activo, pausado, archivado';
COMMENT ON COLUMN procesos.pretensiones IS 'Pretensiones o solicitudes del caso';
COMMENT ON COLUMN procesos.impulso IS 'Indica si el proceso necesita impulso urgente';
COMMENT ON COLUMN procesos.ultima_actuacion_esperada IS 'Descripción de la próxima actuación o acción esperada';
COMMENT ON COLUMN procesos.fecha_proximo_contacto IS 'Fecha programada para el próximo contacto o seguimiento';
COMMENT ON COLUMN procesos.orden IS 'Orden manual para organización personalizada';

-- ============================================================
-- SCRIPT COMPLETADO
-- ============================================================
-- 
-- RESUMEN DE CAMBIOS:
-- ✅ Eliminados: fecha_recordatorio, fecha_inicio, fecha_conclusion, observaciones, activo, numero_proceso, responsable_id
-- ✅ Renombrados: contra_parte → contraparte
-- ✅ Agregados: lugar, ultima_actuacion_esperada, orden
-- ✅ Mantenidos: nombre, cliente_id, rol_cliente_id, materia_id, dependencia, 
--              tipo_proceso_id, estado_id, estado_general, pretensiones, impulso,
--              ultima_actualizacion_id, fecha_proximo_contacto
-- 
-- CAMPOS FINALES (16 campos + timestamps):
-- 1. nombre - Nombre del proceso
-- 2. cliente_id - ID del cliente
-- 3. rol_cliente_id - Rol del cliente
-- 4. contraparte - Contra parte
-- 5. materia_id - Materia legal
-- 6. dependencia - Juzgado/entidad
-- 7. lugar - Ubicación física
-- 8. tipo_proceso_id - Tipo (judicial/administrativo)
-- 9. estado_id - Estado del proceso
-- 10. estado_general - activo/pausado/archivado
-- 11. pretensiones - Pretensiones del caso
-- 12. impulso - Necesita impulso (boolean)
-- 13. ultima_actualizacion_id - Última actualización
-- 14. ultima_actuacion_esperada - Próxima acción esperada
-- 15. fecha_proximo_contacto - Fecha próximo contacto
-- 16. orden - Orden manual
--
-- 📝 IMPORTANTE: 
-- Los empleados asignados (incluyendo el responsable) se gestionan en proceso_empleados
-- 
-- EJEMPLOS DE USO:
-- 
-- 1. Obtener el responsable de un proceso:
--    SELECT e.* 
--    FROM proceso_empleados pe
--    JOIN empleados e ON e.id = pe.empleado_id
--    WHERE pe.proceso_id = 'proceso-uuid' 
--    AND pe.rol = 'responsable' 
--    AND pe.activo = true;
--
-- 2. Obtener todos los empleados de un proceso:
--    SELECT e.nombre, e.apellido, pe.rol
--    FROM proceso_empleados pe
--    JOIN empleados e ON e.id = pe.empleado_id
--    WHERE pe.proceso_id = 'proceso-uuid' 
--    AND pe.activo = true;
--
-- 3. Asignar un responsable a un proceso:
--    INSERT INTO proceso_empleados (proceso_id, empleado_id, rol, activo)
--    VALUES ('proceso-uuid', 'empleado-uuid', 'responsable', true);
