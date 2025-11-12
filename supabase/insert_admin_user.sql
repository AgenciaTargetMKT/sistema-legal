-- ============================================================
-- DATOS DE USUARIO INICIAL - SISTEMA LEGAL
-- ============================================================
-- Este archivo inserta tu usuario empleado vinculado con Supabase Auth
-- IMPORTANTE: Primero debes ejecutar schema.sql y seeds.sql
-- ============================================================

-- ============================================================
-- PASO 1: Obtener el auth_user_id
-- ============================================================
-- Ejecuta esta consulta primero para obtener tu auth_user_id:
-- SELECT id, email FROM auth.users WHERE email = 'aldair0624@gmail.com';
-- Copia el ID que te devuelve y reemplázalo en la siguiente sección

-- ============================================================
-- PASO 2: Insertar empleado
-- ============================================================
-- Reemplaza 'TU_AUTH_USER_ID_AQUI' con el ID que obtuviste en el paso 1

-- Primero obtenemos el ID del rol 'admin' que ya existe en roles_empleados
DO $$
DECLARE
    v_rol_admin_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- Obtener el ID del rol admin
    SELECT id INTO v_rol_admin_id 
    FROM roles_empleados 
    WHERE nombre = 'admin';

    -- Obtener el auth_user_id de tu usuario
    SELECT id INTO v_auth_user_id 
    FROM auth.users 
    WHERE email = 'aldair0624@gmail.com';

    -- Insertar tu empleado
    INSERT INTO empleados (
        auth_user_id,
        rol_id,
        nombre,
        apellido,
        email,
        telefono,
        cargo,
        especialidad,
        fecha_ingreso,
        activo
    ) VALUES (
        v_auth_user_id,
        v_rol_admin_id,
        'Milton Aldair',
        'Castrejon Cueva',
        'aldair0624@gmail.com',
        NULL, -- Puedes agregar tu teléfono aquí
        'Administrador',
        'Administración del Sistema',
        CURRENT_DATE,
        true
    )
    ON CONFLICT (email) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido,
        rol_id = EXCLUDED.rol_id,
        cargo = EXCLUDED.cargo,
        especialidad = EXCLUDED.especialidad;

    RAISE NOTICE 'Usuario empleado creado/actualizado exitosamente';
END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Ejecuta esta consulta para verificar que se creó correctamente:
SELECT 
    e.id,
    e.nombre,
    e.apellido,
    e.email,
    e.cargo,
    r.nombre as rol,
    r.permisos,
    e.activo,
    e.created_at
FROM empleados e
JOIN roles_empleados r ON e.rol_id = r.id
WHERE e.email = 'aldair0624@gmail.com';

-- ============================================================
-- ALTERNATIVA: Si el código anterior no funciona
-- ============================================================
-- Usa este método manual:

/*
-- 1. Primero obtén tu auth_user_id
SELECT id FROM auth.users WHERE email = 'aldair0624@gmail.com';

-- 2. Obtén el rol_id de admin
SELECT id FROM roles_empleados WHERE nombre = 'admin';

-- 3. Inserta tu empleado (reemplaza los UUIDs con los valores reales)
INSERT INTO empleados (
    auth_user_id,
    rol_id,
    nombre,
    apellido,
    email,
    telefono,
    cargo,
    especialidad,
    fecha_ingreso,
    activo
) VALUES (
    'AQUI_TU_AUTH_USER_ID', -- Reemplaza con el ID del paso 1
    'AQUI_EL_ROL_ADMIN_ID', -- Reemplaza con el ID del paso 2
    'Milton Aldair',
    'Castrejon Cueva',
    'aldair0624@gmail.com',
    NULL,
    'Administrador',
    'Administración del Sistema',
    CURRENT_DATE,
    true
);
*/