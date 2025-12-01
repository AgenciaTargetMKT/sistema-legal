-- =====================================================
-- ACTUALIZAR COLORES Y CATEGORÍAS DE ESTADOS DE PROCESO
-- =====================================================

-- Definición de colores:
-- Gris: #6B7280
-- Amarillo: #F59E0B
-- Azul: #3B82F6
-- Marrón: #92400E
-- Naranja: #F97316
-- Morado: #8B5CF6
-- Verde: #10B981

-- =====================================================
-- SECCIÓN: PENDIENTE
-- =====================================================

-- Gris - Pendiente info cliente
UPDATE estados_proceso 
SET color = '#6B7280', categoria = 'Pendiente', orden = 1
WHERE nombre ILIKE '%Pendiente%info%cliente%';

-- Amarillo - Redactando demanda/contestación
UPDATE estados_proceso 
SET color = '#F59E0B', categoria = 'Pendiente', orden = 2
WHERE nombre ILIKE '%Redactando demanda%';

-- Gris - Para conclusión
UPDATE estados_proceso 
SET color = '#6B7280', categoria = 'Pendiente', orden = 3
WHERE nombre ILIKE '%conclusión%' OR nombre ILIKE '%conlusion%';

-- =====================================================
-- SECCIÓN: EN CURSO
-- =====================================================

-- Azul - Por resolver
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'En_curso', orden = 4
WHERE nombre ILIKE '%Por resolver%';

-- Azul - Para admisorio
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'En_curso', orden = 5
WHERE nombre ILIKE '%admisorio%';

-- Marrón - Para contestación
UPDATE estados_proceso 
SET color = '#92400E', categoria = 'En_curso', orden = 6
WHERE nombre ILIKE '%Para contestación%' AND nombre NOT ILIKE '%Demanda%';

-- Azul - Para subsanación/cumple mandato
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'En_curso', orden = 7
WHERE nombre ILIKE '%subsanación%';

-- Amarillo - Para audiencia
UPDATE estados_proceso 
SET color = '#F59E0B', categoria = 'En_curso', orden = 8
WHERE nombre ILIKE '%audiencia%';

-- Morado - Para concesorio apelación
UPDATE estados_proceso 
SET color = '#8B5CF6', categoria = 'En_curso', orden = 9
WHERE nombre ILIKE '%concesorio%apelación%';

-- Gris - Para sentencia
UPDATE estados_proceso 
SET color = '#6B7280', categoria = 'En_curso', orden = 10
WHERE nombre = 'Para sentencia';

-- Gris - Para sentencia de vista
UPDATE estados_proceso 
SET color = '#6B7280', categoria = 'En_curso', orden = 11
WHERE nombre ILIKE '%sentencia de vista%';

-- Azul - Para medida cautelar
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'En_curso', orden = 12
WHERE nombre ILIKE '%medida cautelar%';

-- Azul - Para ejecución forzada
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'En_curso', orden = 13
WHERE nombre ILIKE '%ejecución forzada%';

-- Verde - Para casación
UPDATE estados_proceso 
SET color = '#10B981', categoria = 'En_curso', orden = 14
WHERE nombre ILIKE '%casación%';

-- =====================================================
-- SECCIÓN: COMPLETADO
-- =====================================================

-- Amarillo - Transacción Extrajudicial
UPDATE estados_proceso 
SET color = '#F59E0B', categoria = 'Completado', orden = 15
WHERE nombre ILIKE '%Transacción Extrajudicial%';

-- Morado - Allanamiento
UPDATE estados_proceso 
SET color = '#8B5CF6', categoria = 'Completado', orden = 16
WHERE nombre ILIKE '%Allanamiento%';

-- Marrón - Acuerdo Conciliatorio
UPDATE estados_proceso 
SET color = '#92400E', categoria = 'Completado', orden = 17
WHERE nombre ILIKE '%Acuerdo Conciliatorio%';

-- Naranja - Archivo Definitivo
UPDATE estados_proceso 
SET color = '#F97316', categoria = 'Completado', orden = 18
WHERE nombre ILIKE '%Archivo Definitivo%';

-- Verde - Demanda/Contestación fundada (exacto)
UPDATE estados_proceso 
SET color = '#10B981', categoria = 'Completado', orden = 19
WHERE nombre ILIKE '%fundada%' AND nombre NOT ILIKE '%infundada%' AND nombre NOT ILIKE '%parte%';

-- Azul - Demanda/Contestación fundada en parte
UPDATE estados_proceso 
SET color = '#3B82F6', categoria = 'Completado', orden = 20
WHERE nombre ILIKE '%fundada en parte%';

-- Marrón - Demanda/Contestación infundada
UPDATE estados_proceso 
SET color = '#92400E', categoria = 'Completado', orden = 21
WHERE nombre ILIKE '%infundada%';

-- =====================================================
-- VERIFICAR RESULTADOS
-- =====================================================
SELECT 
    nombre, 
    color, 
    categoria, 
    orden 
FROM estados_proceso 
ORDER BY 
    CASE categoria 
        WHEN 'Pendiente' THEN 1 
        WHEN 'En_curso' THEN 2 
        WHEN 'Completado' THEN 3 
    END, 
    orden;
