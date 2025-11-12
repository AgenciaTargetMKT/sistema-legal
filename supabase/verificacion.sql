-- 🔍 Script de Verificación del Sistema
-- Ejecuta estas consultas en Supabase SQL Editor para verificar que todo está correctamente configurado

-- ============================================
-- 1. VERIFICAR TABLAS CREADAS
-- ============================================
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Deberías ver 17 tablas:
-- actualizaciones_proceso, clientes, comentarios, contactos_clientes,
-- documentos, empleados, estados_proceso, estados_tarea, historial_cambios,
-- impulsos, materias, proceso_empleados, procesos, roles_cliente,
-- roles_empleados, tareas, tipos_proceso

-- ============================================
-- 2. VERIFICAR ROLES DEL SISTEMA
-- ============================================
SELECT 
    nombre,
    descripcion,
    permisos
FROM roles_empleados
ORDER BY nombre;

-- Deberías ver 4 roles:
-- admin, abogado_senior, abogado_junior, asistente_legal

-- ============================================
-- 3. VERIFICAR USUARIO ADMIN
-- ============================================
SELECT 
    e.id,
    e.nombre,
    e.apellido,
    e.email,
    e.cargo,
    r.nombre as rol,
    e.activo,
    e.created_at
FROM empleados e
JOIN roles_empleados r ON e.rol_id = r.id
WHERE e.email = 'aldair0624@gmail.com';

-- Deberías ver:
-- nombre: Milton Aldair
-- apellido: Castrejon Cueva
-- email: aldair0624@gmail.com
-- cargo: Administrador
-- rol: admin
-- activo: true

-- ============================================
-- 4. VERIFICAR VINCULACIÓN CON SUPABASE AUTH
-- ============================================
SELECT 
    e.email as empleado_email,
    e.nombre,
    e.apellido,
    e.auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at,
    au.created_at as auth_created_at
FROM empleados e
LEFT JOIN auth.users au ON e.auth_user_id = au.id
WHERE e.email = 'aldair0624@gmail.com';

-- Verifica que:
-- ✅ auth_user_id NO sea NULL
-- ✅ empleado_email = auth_email
-- ✅ email_confirmed_at tenga una fecha (no NULL)

-- ============================================
-- 5. VERIFICAR DATOS INICIALES (CATÁLOGOS)
-- ============================================

-- Estados de Proceso (deberían ser 9)
SELECT COUNT(*) as total_estados, 
       string_agg(nombre, ', ' ORDER BY nombre) as estados
FROM estados_proceso;

-- Materias (deberían ser 14)
SELECT COUNT(*) as total_materias,
       string_agg(nombre, ', ' ORDER BY nombre) as materias
FROM materias;

-- Tipos de Proceso (deberían ser 7)
SELECT COUNT(*) as total_tipos
FROM tipos_proceso;

-- Estados de Tarea (deberían ser 7)
SELECT COUNT(*) as total_estados
FROM estados_tarea;

-- ============================================
-- 6. VERIFICAR ÍNDICES
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Deberías ver 30+ índices

-- ============================================
-- 7. VERIFICAR TRIGGERS
-- ============================================
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Deberías ver triggers para:
-- - set_updated_at (en todas las tablas)
-- - registrar_cambio (en varias tablas)
-- - actualizar_ultima_actualizacion (en actualizaciones_proceso)

-- ============================================
-- 8. VERIFICAR RLS (ROW LEVEL SECURITY)
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Deberías ver políticas de seguridad en:
-- empleados, clientes, procesos, tareas, etc.

-- ============================================
-- 9. VERIFICAR VISTAS
-- ============================================
SELECT 
    schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Deberías ver 3 vistas:
-- vista_empleados_completa
-- vista_procesos_completa
-- vista_tareas_pendientes

-- ============================================
-- 10. TEST DE PERMISOS DEL ROL ADMIN
-- ============================================
SELECT 
    r.nombre as rol,
    r.permisos->'procesos' as permisos_procesos,
    r.permisos->'clientes' as permisos_clientes,
    r.permisos->'empleados' as permisos_empleados,
    r.permisos->'tareas' as permisos_tareas
FROM roles_empleados r
WHERE r.nombre = 'admin';

-- Todos los permisos deberían estar en true

-- ============================================
-- 11. VERIFICAR EXTENSIONES
-- ============================================
SELECT 
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Deberías ver estas extensiones instaladas

-- ============================================
-- 12. TEST DE INSERCIÓN (OPCIONAL)
-- ============================================
-- Intenta crear un cliente de prueba:
/*
INSERT INTO clientes (
    tipo_persona,
    nombre_razon_social,
    numero_documento,
    email,
    telefono,
    direccion
) VALUES (
    'natural',
    'Cliente de Prueba',
    '12345678',
    'prueba@test.com',
    '999888777',
    'Calle Test 123'
) RETURNING *;
*/

-- Si funciona, elimínalo:
-- DELETE FROM clientes WHERE email = 'prueba@test.com';

-- ============================================
-- ✅ RESUMEN DE VERIFICACIÓN
-- ============================================
SELECT 
    'Tablas' as componente,
    COUNT(*) as cantidad
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Índices' as componente,
    COUNT(*) as cantidad
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Triggers' as componente,
    COUNT(*) as cantidad
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
    'Políticas RLS' as componente,
    COUNT(*) as cantidad
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Vistas' as componente,
    COUNT(*) as cantidad
FROM pg_views
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Roles' as componente,
    COUNT(*) as cantidad
FROM roles_empleados

UNION ALL

SELECT 
    'Empleados' as componente,
    COUNT(*) as cantidad
FROM empleados;

-- ============================================
-- 📊 RESULTADOS ESPERADOS
-- ============================================
-- Tablas: 17
-- Índices: 30+
-- Triggers: 20+
-- Políticas RLS: 10+
-- Vistas: 3
-- Roles: 4
-- Empleados: 1 (Milton Aldair)

-- ============================================
-- 🎯 Si todos los números coinciden, 
--    ¡tu base de datos está 100% configurada!
-- ============================================
