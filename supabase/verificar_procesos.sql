-- ============================================================
-- SCRIPT DE VERIFICACIÓN: CAMPOS DE TABLA PROCESOS
-- ============================================================
-- Este script te muestra qué campos tienes actualmente
-- y te ayuda a verificar que todo esté correcto
-- ============================================================

-- Ver todos los campos actuales de la tabla procesos
SELECT 
    column_name AS "Campo",
    data_type AS "Tipo",
    character_maximum_length AS "Longitud",
    is_nullable AS "Permite NULL",
    column_default AS "Valor por defecto"
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'procesos'
ORDER BY 
    ordinal_position;

-- Ver todas las foreign keys (relaciones)
SELECT
    tc.constraint_name AS "Constraint",
    tc.table_name AS "Tabla",
    kcu.column_name AS "Campo",
    ccu.table_name AS "Tabla Referenciada",
    ccu.column_name AS "Campo Referenciado"
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='procesos';

-- Ver todos los índices
SELECT
    indexname AS "Índice",
    indexdef AS "Definición"
FROM
    pg_indexes
WHERE
    tablename = 'procesos'
    AND schemaname = 'public';

-- ============================================================
-- CHECKLIST DE CAMPOS REQUERIDOS
-- ============================================================
-- 
-- VERIFICA QUE EXISTAN ESTOS CAMPOS:
-- 
-- ✓ nombre               - Nombre del proceso
-- ✓ cliente_id           - ID del cliente (FK → clientes)
-- ✓ rol_cliente_id       - Rol del cliente (FK → roles_cliente)
-- ✓ vs                   - Contra parte (la otra parte del caso)
-- ✓ materia_id           - Materia legal (FK → materias)
-- ✓ dependencia          - Juzgado o entidad
-- ✓ lugar                - Ubicación física
-- ✓ tipo_proceso_id      - Tipo: judicial/administrativo (FK → tipos_proceso)
-- ✓ estado_id            - Estado del proceso (FK → estados_proceso)
-- ✓ estado_general       - activo/pausado/archivado
-- ✓ pretensiones         - Pretensiones del caso
-- ✓ impulso              - Si necesita impulso (boolean)
-- ✓ responsable_id       - Empleado responsable (FK → empleados)
-- ✓ ultima_actualizacion_id - Última actualización (FK → actualizaciones_proceso)
-- ✓ ultima_actuacion_esperada - Próxima acción esperada (TEXT)
-- ✓ fecha_proximo_contacto - Fecha de próximo contacto
-- ✓ orden                - Orden manual (integer)
-- 
-- CAMPOS QUE NO DEBEN EXISTIR:
-- ✗ numero_proceso
-- ✗ contra_parte (debe ser 'vs')
-- ✗ fecha_recordatorio
-- ✗ fecha_inicio
-- ✗ fecha_conclusion
-- ✗ observaciones
-- ✗ activo
