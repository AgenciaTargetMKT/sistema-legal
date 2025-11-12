-- ============================================================
-- SISTEMA LEGAL - ESQUEMA DE BASE DE DATOS
-- ============================================================

-- ============================================================
-- LIMPIAR BASE DE DATOS (Eliminar todo antes de crear)
-- ============================================================

-- Eliminar vistas
DROP VIEW IF EXISTS vista_empleados_completa CASCADE;
DROP VIEW IF EXISTS vista_tareas_pendientes CASCADE;
DROP VIEW IF EXISTS vista_procesos_completa CASCADE;

-- Eliminar triggers
DROP TRIGGER IF EXISTS audit_tareas ON tareas;
DROP TRIGGER IF EXISTS audit_procesos ON procesos;
DROP TRIGGER IF EXISTS trigger_actualizar_ultima_actualizacion ON actualizaciones_proceso;
DROP TRIGGER IF EXISTS update_impulsos_updated_at ON impulsos;
DROP TRIGGER IF EXISTS update_tareas_updated_at ON tareas;
DROP TRIGGER IF EXISTS update_procesos_updated_at ON procesos;
DROP TRIGGER IF EXISTS update_contactos_updated_at ON contactos_clientes;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;

-- Eliminar funciones
DROP FUNCTION IF EXISTS registrar_cambio() CASCADE;
DROP FUNCTION IF EXISTS actualizar_ultima_actualizacion() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar tablas en orden inverso de dependencias
DROP TABLE IF EXISTS historial_cambios CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS impulsos CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS estados_tarea CASCADE;
DROP TABLE IF EXISTS proceso_empleados CASCADE;
DROP TABLE IF EXISTS actualizaciones_proceso CASCADE;
DROP TABLE IF EXISTS procesos CASCADE;
DROP TABLE IF EXISTS tipos_proceso CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS roles_cliente CASCADE;
DROP TABLE IF EXISTS estados_proceso CASCADE;
DROP TABLE IF EXISTS contactos_clientes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;
DROP TABLE IF EXISTS roles_empleados CASCADE;

-- ============================================================
-- CREAR EXTENSIONES
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: roles_empleados (Catálogo de roles)
-- ============================================================
CREATE TABLE roles_empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB, -- Permisos específicos en formato JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: empleados (Abogados/Usuarios)
-- Vinculado con auth.users de Supabase
-- ============================================================
CREATE TABLE empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES roles_empleados(id), -- Relación con tabla de roles
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    especialidad VARCHAR(150),
    fecha_ingreso DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL, -- Nombre o Razón Social
    tipo_cliente VARCHAR(20) DEFAULT 'persona_natural', -- persona_natural, empresa
    documento_identidad VARCHAR(50), -- DNI o RUC
    condicion VARCHAR(50) DEFAULT 'activo', -- activo, potencial, excelente
    categoria VARCHAR(50), -- premium, corte, pago, etc.
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: contactos_clientes (Contactos de los clientes)
-- ============================================================
CREATE TABLE contactos_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    es_principal BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: estados_proceso (Catálogo de estados de proceso)
-- ============================================================
CREATE TABLE estados_proceso (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    color VARCHAR(20), -- Para UI
    orden INTEGER, -- Para ordenar en UI
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: roles_cliente (Catálogo de roles del cliente en proceso)
-- ============================================================
CREATE TABLE roles_cliente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- demandante, demandado, denunciante, denunciado
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: materias (Catálogo de materias legales)
-- ============================================================
CREATE TABLE materias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- Laboral, Penal, Civil, Comercial, etc.
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: tipos_proceso (Catálogo de tipos de proceso)
-- ============================================================
CREATE TABLE tipos_proceso (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- P.Administrativo, P.Judicial, Convenio Arbitral
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: procesos
-- ============================================================
CREATE TABLE procesos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_proceso VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    rol_cliente_id UUID REFERENCES roles_cliente(id),
    contra_parte VARCHAR(255), -- Vs quien (la otra parte)
    materia_id UUID REFERENCES materias(id),
    pretensiones TEXT,
    dependencia VARCHAR(255), -- Juzgado, entidad, etc.
    tipo_proceso_id UUID REFERENCES tipos_proceso(id),
    estado_id UUID REFERENCES estados_proceso(id),
    estado_general VARCHAR(50) DEFAULT 'activo', -- activo, pausado, concluido, archivado
    impulso BOOLEAN DEFAULT false,
    ultima_actualizacion_id UUID, -- Referencia a la última actualización
    fecha_proximo_contacto DATE,
    fecha_recordatorio DATE,
    fecha_inicio DATE,
    fecha_conclusion DATE,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: actualizaciones_proceso
-- ============================================================
CREATE TABLE actualizaciones_proceso (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'actualizacion', -- actualizacion, nota, documento, audiencia
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar la foreign key para ultima_actualizacion_id después de crear la tabla
ALTER TABLE procesos 
ADD CONSTRAINT fk_ultima_actualizacion 
FOREIGN KEY (ultima_actualizacion_id) 
REFERENCES actualizaciones_proceso(id) 
ON DELETE SET NULL;

-- ============================================================
-- TABLA: proceso_empleados (Relación muchos a muchos)
-- Un proceso puede tener varios empleados asignados
-- ============================================================
CREATE TABLE proceso_empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
    rol VARCHAR(100), -- responsable, asistente, consultor
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proceso_id, empleado_id)
);

-- ============================================================
-- TABLA: estados_tarea (Catálogo de estados de tareas)
-- ============================================================
CREATE TABLE estados_tarea (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL, -- por_asignar, sin_empezar, en_curso, completada, cancelada
    descripcion TEXT,
    color VARCHAR(20),
    orden INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: tareas
-- ============================================================
CREATE TABLE tareas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado_id UUID REFERENCES estados_tarea(id),
    empleado_asignado_id UUID REFERENCES empleados(id),
    fecha_limite DATE,
    fecha_vencimiento DATE,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta, urgente
    tiempo_estimado INTEGER, -- en horas
    tiempo_real INTEGER, -- en horas
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: impulsos (Recordatorios/Fechas importantes)
-- ============================================================
CREATE TABLE impulsos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'recordatorio', -- recordatorio, audiencia, vencimiento, cita, diligencia
    fecha_impulso TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo', -- activo, completado, cancelado
    notificado BOOLEAN DEFAULT false,
    fecha_notificacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: documentos (Archivos adjuntos)
-- ============================================================
CREATE TABLE documentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100), -- demanda, escrito, sentencia, etc.
    ruta_archivo TEXT NOT NULL,
    tamanio BIGINT, -- en bytes
    mime_type VARCHAR(100),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: comentarios (Notas y comentarios)
-- ============================================================
CREATE TABLE comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    contenido TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'nota', -- nota, observacion, consulta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: historial_cambios (Auditoría)
-- ============================================================
CREATE TABLE historial_cambios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tabla VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    empleado_id UUID REFERENCES empleados(id),
    accion VARCHAR(50) NOT NULL, -- insert, update, delete
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================

-- Índices para empleados
CREATE INDEX idx_empleados_auth_user_id ON empleados(auth_user_id);
CREATE INDEX idx_empleados_rol_id ON empleados(rol_id);
CREATE INDEX idx_empleados_email ON empleados(email);
CREATE INDEX idx_empleados_activo ON empleados(activo);

-- Índices para clientes
CREATE INDEX idx_clientes_tipo ON clientes(tipo_cliente);
CREATE INDEX idx_clientes_documento ON clientes(documento_identidad);
CREATE INDEX idx_clientes_condicion ON clientes(condicion);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- Índices para contactos_clientes
CREATE INDEX idx_contactos_cliente_id ON contactos_clientes(cliente_id);
CREATE INDEX idx_contactos_principal ON contactos_clientes(es_principal);

-- Índices para procesos
CREATE INDEX idx_procesos_cliente_id ON procesos(cliente_id);
CREATE INDEX idx_procesos_estado_id ON procesos(estado_id);
CREATE INDEX idx_procesos_materia_id ON procesos(materia_id);
CREATE INDEX idx_procesos_tipo_id ON procesos(tipo_proceso_id);
CREATE INDEX idx_procesos_estado_general ON procesos(estado_general);
CREATE INDEX idx_procesos_fecha_proximo_contacto ON procesos(fecha_proximo_contacto);
CREATE INDEX idx_procesos_fecha_recordatorio ON procesos(fecha_recordatorio);
CREATE INDEX idx_procesos_impulso ON procesos(impulso);
CREATE INDEX idx_procesos_activo ON procesos(activo);

-- Índices para actualizaciones
CREATE INDEX idx_actualizaciones_proceso_id ON actualizaciones_proceso(proceso_id);
CREATE INDEX idx_actualizaciones_fecha ON actualizaciones_proceso(fecha_actualizacion);

-- Índices para proceso_empleados
CREATE INDEX idx_proceso_empleados_proceso ON proceso_empleados(proceso_id);
CREATE INDEX idx_proceso_empleados_empleado ON proceso_empleados(empleado_id);

-- Índices para tareas
CREATE INDEX idx_tareas_proceso_id ON tareas(proceso_id);
CREATE INDEX idx_tareas_empleado_id ON tareas(empleado_asignado_id);
CREATE INDEX idx_tareas_estado_id ON tareas(estado_id);
CREATE INDEX idx_tareas_fecha_limite ON tareas(fecha_limite);
CREATE INDEX idx_tareas_fecha_vencimiento ON tareas(fecha_vencimiento);

-- Índices para impulsos
CREATE INDEX idx_impulsos_proceso_id ON impulsos(proceso_id);
CREATE INDEX idx_impulsos_fecha ON impulsos(fecha_impulso);
CREATE INDEX idx_impulsos_estado ON impulsos(estado);
CREATE INDEX idx_impulsos_notificado ON impulsos(notificado);

-- Índices para documentos
CREATE INDEX idx_documentos_proceso_id ON documentos(proceso_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo_documento);

-- ============================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contactos_updated_at BEFORE UPDATE ON contactos_clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procesos_updated_at BEFORE UPDATE ON procesos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impulsos_updated_at BEFORE UPDATE ON impulsos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Actualizar ultima_actualizacion_id en procesos
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_ultima_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE procesos 
    SET ultima_actualizacion_id = NEW.id 
    WHERE id = NEW.proceso_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_actualizar_ultima_actualizacion 
AFTER INSERT ON actualizaciones_proceso
FOR EACH ROW EXECUTE FUNCTION actualizar_ultima_actualizacion();

-- ============================================================
-- TRIGGER: Registrar cambios en historial_cambios
-- ============================================================

CREATE OR REPLACE FUNCTION registrar_cambio()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO historial_cambios (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, OLD.id, 'update', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO historial_cambios (tabla, registro_id, accion, datos_anteriores)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO historial_cambios (tabla, registro_id, accion, datos_nuevos)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Aplicar trigger de auditoría a tablas principales
CREATE TRIGGER audit_procesos AFTER INSERT OR UPDATE OR DELETE ON procesos
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio();

CREATE TRIGGER audit_tareas AFTER INSERT OR UPDATE OR DELETE ON tareas
    FOR EACH ROW EXECUTE FUNCTION registrar_cambio();

-- ============================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================================

-- Habilitar RLS en las tablas principales
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE procesos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE impulsos ENABLE ROW LEVEL SECURITY;

-- Política para empleados: solo pueden ver su propio registro o si son admin
CREATE POLICY empleados_policy ON empleados
    FOR ALL
    USING (
        auth.uid() = auth_user_id OR 
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre = 'admin'
        )
    );

-- Política para procesos: solo empleados asignados o admin pueden ver
CREATE POLICY procesos_policy ON procesos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM proceso_empleados pe
            JOIN empleados e ON e.id = pe.empleado_id
            WHERE pe.proceso_id = procesos.id
            AND e.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM empleados e
            JOIN roles_empleados r ON e.rol_id = r.id
            WHERE e.auth_user_id = auth.uid() 
            AND r.nombre = 'admin'
        )
    );

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista de procesos con toda la información relacionada
CREATE OR REPLACE VIEW vista_procesos_completa AS
SELECT 
    p.id,
    p.numero_proceso,
    p.nombre,
    p.contra_parte,
    p.pretensiones,
    p.dependencia,
    p.impulso,
    p.fecha_proximo_contacto,
    p.fecha_recordatorio,
    p.estado_general,
    c.nombre AS cliente_nombre,
    c.documento_identidad AS cliente_documento,
    c.tipo_cliente,
    rc.nombre AS rol_cliente,
    m.nombre AS materia,
    tp.nombre AS tipo_proceso,
    ep.nombre AS estado_proceso,
    ep.color AS estado_color,
    au.descripcion AS ultima_actualizacion,
    au.fecha_actualizacion AS fecha_ultima_actualizacion,
    p.created_at,
    p.updated_at
FROM procesos p
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN roles_cliente rc ON p.rol_cliente_id = rc.id
LEFT JOIN materias m ON p.materia_id = m.id
LEFT JOIN tipos_proceso tp ON p.tipo_proceso_id = tp.id
LEFT JOIN estados_proceso ep ON p.estado_id = ep.id
LEFT JOIN actualizaciones_proceso au ON p.ultima_actualizacion_id = au.id;

-- Vista de tareas pendientes por empleado
CREATE OR REPLACE VIEW vista_tareas_pendientes AS
SELECT 
    t.id,
    t.nombre,
    t.descripcion,
    t.fecha_limite,
    t.fecha_vencimiento,
    t.prioridad,
    e.nombre AS empleado_nombre,
    e.apellido AS empleado_apellido,
    p.numero_proceso,
    p.nombre AS proceso_nombre,
    c.nombre AS cliente_nombre,
    et.nombre AS estado_tarea,
    et.color AS estado_color,
    CASE 
        WHEN t.fecha_vencimiento < CURRENT_DATE THEN true
        ELSE false
    END AS esta_vencida,
    t.created_at,
    t.updated_at
FROM tareas t
LEFT JOIN empleados e ON t.empleado_asignado_id = e.id
LEFT JOIN procesos p ON t.proceso_id = p.id
LEFT JOIN clientes c ON p.cliente_id = c.id
LEFT JOIN estados_tarea et ON t.estado_id = et.id
WHERE t.activo = true
AND et.nombre NOT IN ('completada', 'cancelada');

-- Vista de empleados con información completa incluyendo rol
CREATE OR REPLACE VIEW vista_empleados_completa AS
SELECT 
    e.id,
    e.nombre,
    e.apellido,
    e.nombre || ' ' || e.apellido AS nombre_completo,
    e.email,
    e.telefono,
    e.cargo,
    e.especialidad,
    e.fecha_ingreso,
    e.activo,
    r.nombre AS rol_nombre,
    r.descripcion AS rol_descripcion,
    r.permisos AS rol_permisos,
    e.created_at,
    e.updated_at
FROM empleados e
LEFT JOIN roles_empleados r ON e.rol_id = r.id;

