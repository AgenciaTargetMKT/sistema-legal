-- ============================================================
-- DATOS INICIALES (SEEDS) - SISTEMA LEGAL
-- ============================================================
-- Este archivo contiene los datos iniciales para las tablas catálogo
-- Ejecutar DESPUÉS de crear el esquema principal
-- ============================================================

-- ============================================================
-- ROLES DE EMPLEADOS
-- ============================================================
INSERT INTO roles_empleados (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema', '{"all": true}'),
('abogado', 'Abogado con acceso completo a casos asignados', '{"procesos": "full", "clientes": "full", "tareas": "full"}'),
('asistente', 'Asistente legal con permisos limitados', '{"procesos": "read", "tareas": "edit"}'),
('paralegal', 'Paralegal con permisos de lectura y actualización', '{"procesos": "read", "tareas": "edit", "documentos": "upload"}');

-- ============================================================
-- ESTADOS DE PROCESO
-- ============================================================
INSERT INTO estados_proceso (nombre, descripcion, color, orden) VALUES
('ejecucion_forzada', 'Para Ejecución Forzada', '#EF4444', 1),
('pendiente_info_cliente', 'Pendiente de Info del Cliente', '#F59E0B', 2),
('redactando_demanda', 'Redactando Demanda', '#3B82F6', 3),
('para_confusion', 'Para Confusión', '#8B5CF6', 4),
('por_resolver', 'Por Resolver', '#10B981', 5),
('para_admisorio', 'Para Admisorio', '#06B6D4', 6),
('para_contestacion', 'Para Contestación', '#EC4899', 7),
('para_subsanacion', 'Para Subsanación', '#F97316', 8),
('para_audiencia', 'Para Audiencia', '#84CC16', 9);

-- ============================================================
-- ROLES DE CLIENTE EN PROCESO
-- ============================================================
INSERT INTO roles_cliente (nombre, descripcion) VALUES
('demandante', 'Parte demandante en el proceso'),
('demandado', 'Parte demandada en el proceso'),
('denunciante', 'Parte denunciante'),
('denunciado', 'Parte denunciada'),
('querellante', 'Parte querellante'),
('querellado', 'Parte querellada'),
('actor', 'Actor civil'),
('tercero', 'Tercero interviniente'),
('agraviado', 'Agraviado en el proceso');

-- ============================================================
-- MATERIAS LEGALES
-- ============================================================
INSERT INTO materias (nombre, descripcion) VALUES
('Laboral', 'Derecho laboral y relaciones de trabajo'),
('Penal', 'Derecho penal y delitos'),
('Civil', 'Derecho civil general'),
('Comercial', 'Derecho comercial y empresarial'),
('Familia', 'Derecho de familia'),
('Administrativo', 'Derecho administrativo'),
('Constitucional', 'Derecho constitucional'),
('Tributario', 'Derecho tributario'),
('Ambiental', 'Derecho ambiental'),
('Inmobiliario', 'Derecho inmobiliario y registral'),
('Propiedad Intelectual', 'Derecho de propiedad intelectual'),
('Migratorio', 'Derecho migratorio'),
('Marítimo', 'Derecho marítimo'),
('Minero', 'Derecho minero');

-- ============================================================
-- TIPOS DE PROCESO
-- ============================================================
INSERT INTO tipos_proceso (nombre, descripcion) VALUES
('P.Administrativo', 'Proceso Administrativo'),
('P.Judicial', 'Proceso Judicial'),
('Convenio Arbitral', 'Convenio de Arbitraje'),
('Conciliación', 'Proceso de Conciliación'),
('Mediación', 'Proceso de Mediación'),
('Ejecución', 'Proceso de Ejecución'),
('Cautelar', 'Medida Cautelar');

-- ============================================================
-- ESTADOS DE TAREA
-- ============================================================
INSERT INTO estados_tarea (nombre, descripcion, color, orden) VALUES
('por_asignar', 'Por Asignar', '#6B7280', 1),
('sin_empezar', 'Sin Empezar', '#9CA3AF', 2),
('en_curso', 'En Curso', '#3B82F6', 3),
('en_revision', 'En Revisión', '#8B5CF6', 4),
('completada', 'Completada', '#10B981', 5),
('cancelada', 'Cancelada', '#EF4444', 6),
('bloqueada', 'Bloqueada', '#F59E0B', 7);

-- ============================================================
-- CLIENTES (DATOS DE EJEMPLO)
-- ============================================================
INSERT INTO clientes (nombre, tipo_cliente, documento_identidad, condicion, categoria, email, telefono, direccion) VALUES
('María González Pérez', 'persona_natural', '72345678', 'activo', 'premium', 'maria.gonzalez@email.com', '+51 987 654 321', 'Av. Larco 1234, Miraflores, Lima'),
('Carlos Ramírez Torres', 'persona_natural', '41234567', 'activo', 'corte', 'carlos.ramirez@email.com', '+51 912 345 678', 'Jr. Las Flores 456, San Isidro, Lima'),
('Constructora El Sol S.A.C.', 'empresa', '20567890123', 'excelente', 'premium', 'contacto@constructoraelsol.pe', '+51 01 234 5678', 'Av. Javier Prado 2890, San Borja, Lima'),
('Ana Lucía Mendoza', 'persona_natural', '43567890', 'potencial', 'pago', 'ana.mendoza@email.com', '+51 923 456 789', 'Calle Los Pinos 789, La Molina, Lima'),
('Inversiones del Norte S.A.', 'empresa', '20678901234', 'activo', 'premium', 'legal@inversionesdelnorte.com', '+51 01 345 6789', 'Av. El Sol 1500, Surco, Lima'),
('Roberto Silva Vargas', 'persona_natural', '45678901', 'activo', 'corte', 'roberto.silva@email.com', '+51 934 567 890', 'Av. Universitaria 3456, Los Olivos, Lima'),
('Comercial Andina E.I.R.L.', 'empresa', '20789012345', 'activo', 'pago', 'admin@comercialandina.pe', '+51 01 456 7890', 'Av. Colonial 2345, Callao'),
('Patricia Flores Quispe', 'persona_natural', '46789012', 'excelente', 'premium', 'patricia.flores@email.com', '+51 945 678 901', 'Calle Santa Rosa 567, Barranco, Lima');

-- ============================================================
-- CONTACTOS DE CLIENTES
-- ============================================================
INSERT INTO contactos_clientes (cliente_id, nombre, cargo, telefono, email, es_principal) VALUES
-- Contactos para Constructora El Sol S.A.C.
((SELECT id FROM clientes WHERE documento_identidad = '20567890123'), 'Jorge Salazar', 'Gerente General', '+51 987 111 222', 'jsalazar@constructoraelsol.pe', true),
((SELECT id FROM clientes WHERE documento_identidad = '20567890123'), 'Luisa Herrera', 'Jefa Legal', '+51 987 333 444', 'lherrera@constructoraelsol.pe', false),
-- Contactos para Inversiones del Norte S.A.
((SELECT id FROM clientes WHERE documento_identidad = '20678901234'), 'Manuel Rojas', 'Apoderado', '+51 987 555 666', 'mrojas@inversionesdelnorte.com', true),
((SELECT id FROM clientes WHERE documento_identidad = '20678901234'), 'Carmen Díaz', 'Asistente Legal', '+51 987 777 888', 'cdiaz@inversionesdelnorte.com', false);

-- ============================================================
-- PROCESOS (DATOS DE EJEMPLO)
-- ============================================================

-- Primero, obtenemos los IDs necesarios para las relaciones
-- Proceso 1: Laboral - Despido Arbitrario
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    '00123-2024-0-1801-JR-LA-10',
    'Reposición por Despido Arbitrario',
    (SELECT id FROM clientes WHERE documento_identidad = '72345678'),
    (SELECT id FROM roles_cliente WHERE nombre = 'demandante'),
    'Empresa Textil La Victoria S.A.C.',
    (SELECT id FROM materias WHERE nombre = 'Laboral'),
    'Reposición al puesto de trabajo, pago de remuneraciones dejadas de percibir, indemnización por daños y perjuicios',
    '10° Juzgado de Trabajo de Lima',
    (SELECT id FROM tipos_proceso WHERE nombre = 'P.Judicial'),
    (SELECT id FROM estados_proceso WHERE nombre = 'para_audiencia'),
    'activo',
    true,
    '2025-01-15',
    '2024-03-10',
    'Audiencia de conciliación programada para enero 2025'
);

-- Proceso 2: Civil - Desalojo por Falta de Pago
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    '00456-2024-0-1801-JR-CI-05',
    'Desalojo por Falta de Pago',
    (SELECT id FROM clientes WHERE documento_identidad = '20567890123'),
    (SELECT id FROM roles_cliente WHERE nombre = 'demandante'),
    'Luis Alberto Campos Rodríguez',
    (SELECT id FROM materias WHERE nombre = 'Civil'),
    'Desalojo del inmueble ubicado en Jr. Huancayo 234, Lima, pago de rentas devengadas y costas del proceso',
    '5° Juzgado Civil de Lima',
    (SELECT id FROM tipos_proceso WHERE nombre = 'P.Judicial'),
    (SELECT id FROM estados_proceso WHERE nombre = 'para_contestacion'),
    'activo',
    false,
    '2024-12-20',
    '2024-09-05',
    'Demandado notificado, plazo para contestar demanda'
);

-- Proceso 3: Comercial - Incumplimiento de Contrato
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    'EXP-2024-789',
    'Resolución de Contrato e Indemnización',
    (SELECT id FROM clientes WHERE documento_identidad = '20678901234'),
    (SELECT id FROM roles_cliente WHERE nombre = 'demandante'),
    'Distribuidora Comercial Los Andes S.R.L.',
    (SELECT id FROM materias WHERE nombre = 'Comercial'),
    'Resolución de contrato de suministro, devolución de pagos adelantados, indemnización por daños',
    'Centro de Arbitraje PUCP',
    (SELECT id FROM tipos_proceso WHERE nombre = 'Convenio Arbitral'),
    (SELECT id FROM estados_proceso WHERE nombre = 'por_resolver'),
    'activo',
    true,
    '2024-12-01',
    '2024-06-15',
    'En etapa de alegatos finales'
);

-- Proceso 4: Familia - Divorcio por Causal
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    '00234-2024-0-1817-JR-FC-03',
    'Divorcio por Causal de Separación de Hecho',
    (SELECT id FROM clientes WHERE documento_identidad = '41234567'),
    (SELECT id FROM roles_cliente WHERE nombre = 'demandante'),
    'Sandra Mónica Ruiz Vásquez',
    (SELECT id FROM materias WHERE nombre = 'Familia'),
    'Divorcio por causal de separación de hecho, liquidación de sociedad de gananciales, tenencia y alimentos',
    '3° Juzgado de Familia de Lima',
    (SELECT id FROM tipos_proceso WHERE nombre = 'P.Judicial'),
    (SELECT id FROM estados_proceso WHERE nombre = 'redactando_demanda'),
    'activo',
    false,
    '2024-12-10',
    '2024-11-01',
    'Reuniendo documentación de bienes gananciales'
);

-- Proceso 5: Penal - Apropiación Ilícita
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    '00678-2024-0-1826-JR-PE-01',
    'Apropiación Ilícita Agravada',
    (SELECT id FROM clientes WHERE documento_identidad = '20789012345'),
    (SELECT id FROM roles_cliente WHERE nombre = 'agraviado'),
    'Fernando José Paredes Luna',
    (SELECT id FROM materias WHERE nombre = 'Penal'),
    'Reparación civil por S/ 120,000.00, pago de costas procesales',
    '1° Juzgado Penal de Lima',
    (SELECT id FROM tipos_proceso WHERE nombre = 'P.Judicial'),
    (SELECT id FROM estados_proceso WHERE nombre = 'para_audiencia'),
    'activo',
    true,
    '2024-12-18',
    '2024-05-20',
    'Audiencia de juicio oral próxima'
);

-- Proceso 6: Administrativo - Nulidad de Resolución
INSERT INTO procesos (
    numero_proceso, 
    nombre, 
    cliente_id, 
    rol_cliente_id, 
    contra_parte, 
    materia_id, 
    pretensiones, 
    dependencia, 
    tipo_proceso_id, 
    estado_id,
    estado_general,
    impulso,
    fecha_proximo_contacto,
    fecha_inicio,
    observaciones
) VALUES (
    'EXP-2024-1234-PA',
    'Nulidad de Resolución Administrativa',
    (SELECT id FROM clientes WHERE documento_identidad = '45678901'),
    (SELECT id FROM roles_cliente WHERE nombre = 'demandante'),
    'Municipalidad Distrital de San Miguel',
    (SELECT id FROM materias WHERE nombre = 'Administrativo'),
    'Nulidad de Resolución de Multa Nro 045-2024, restitución de licencia de funcionamiento',
    'Tribunal del Servicio Civil',
    (SELECT id FROM tipos_proceso WHERE nombre = 'P.Administrativo'),
    (SELECT id FROM estados_proceso WHERE nombre = 'para_subsanacion'),
    'activo',
    false,
    '2024-12-05',
    '2024-08-10',
    'Observaciones subsanadas, pendiente pronunciamiento'
);

-- ============================================================
-- ACTUALIZACIONES DE PROCESO
-- ============================================================

-- Actualizaciones para Proceso 1 (Laboral)
INSERT INTO actualizaciones_proceso (proceso_id, descripcion, tipo, fecha_actualizacion) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'), 
 'Se presentó la demanda con todos los anexos. Admitida a trámite.', 
 'actualizacion', 
 '2024-03-15 10:30:00'),
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'), 
 'Demandada notificada exitosamente. Presentó contestación dentro del plazo.', 
 'nota', 
 '2024-05-20 14:45:00'),
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'), 
 'Audiencia de conciliación fijada para el 15 de enero de 2025 a las 9:00 am', 
 'audiencia', 
 '2024-11-02 11:00:00');

-- Actualizaciones para Proceso 2 (Desalojo)
INSERT INTO actualizaciones_proceso (proceso_id, descripcion, tipo, fecha_actualizacion) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'), 
 'Demanda admitida. Se corre traslado al demandado.', 
 'actualizacion', 
 '2024-09-10 16:20:00'),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'), 
 'Demandado notificado. Corre plazo para contestar demanda.', 
 'nota', 
 '2024-11-25 09:15:00');

-- Actualizaciones para Proceso 3 (Comercial)
INSERT INTO actualizaciones_proceso (proceso_id, descripcion, tipo, fecha_actualizacion) VALUES
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'), 
 'Tribunal arbitral constituido. Se designó presidente.', 
 'actualizacion', 
 '2024-07-01 10:00:00'),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'), 
 'Ambas partes presentaron alegatos finales. Tribunal en deliberación.', 
 'nota', 
 '2024-10-30 15:30:00');

-- ============================================================
-- ASIGNACIÓN DE PROCESOS A EMPLEADOS
-- ============================================================
-- Asignar todos los procesos al empleado admin para que pueda verlos
INSERT INTO proceso_empleados (proceso_id, empleado_id, rol, activo) VALUES
-- Asignar todos los procesos al primer empleado (usuario admin)
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true),
((SELECT id FROM procesos WHERE numero_proceso = '00234-2024-0-1817-JR-FC-03'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true),
((SELECT id FROM procesos WHERE numero_proceso = '00678-2024-0-1826-JR-PE-01'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-1234-PA'),
 (SELECT id FROM empleados ORDER BY created_at LIMIT 1),
 'responsable',
 true);

-- ============================================================
-- TAREAS (RELACIONADAS A LOS PROCESOS)
-- ============================================================

-- Tareas para Proceso 1 (Laboral - Despido Arbitrario)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 'Preparar escrito de alegatos previos a audiencia',
 'Elaborar documento con argumentos jurídicos y pruebas para la audiencia de conciliación',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2025-01-10',
 '2025-01-10',
 'alta'),
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 'Coordinar con cliente para audiencia',
 'Reunión preparatoria con la cliente María González para revisar estrategia de conciliación',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2025-01-12',
 '2025-01-12',
 'alta'),
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 'Revisar liquidación de beneficios sociales',
 'Verificar cálculos de remuneraciones dejadas de percibir y beneficios adeudados',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2025-01-08',
 '2025-01-08',
 'media');

-- Tareas para Proceso 2 (Desalojo)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 'Revisar contestación de demanda',
 'Analizar contestación presentada por el demandado e identificar puntos controvertidos',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2024-12-15',
 '2024-12-15',
 'alta'),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 'Preparar ofrecimiento de medios probatorios',
 'Elaborar escrito con documentales y pericias a ofrecer en la etapa probatoria',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2024-12-22',
 '2024-12-22',
 'media'),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 'Actualizar liquidación de rentas devengadas',
 'Calcular monto actualizado de rentas impagas hasta la fecha',
 (SELECT id FROM estados_tarea WHERE nombre = 'por_asignar'),
 '2024-12-18',
 '2024-12-18',
 'media');

-- Tareas para Proceso 3 (Arbitraje Comercial)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'),
 'Realizar seguimiento del laudo arbitral',
 'Contactar con el Centro de Arbitraje para conocer fecha probable de emisión del laudo',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2024-12-05',
 '2024-12-05',
 'alta'),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'),
 'Preparar recursos impugnatorios eventuales',
 'Revisar fundamentos para posible recurso de anulación si el laudo es desfavorable',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2024-12-10',
 '2024-12-10',
 'media');

-- Tareas para Proceso 4 (Divorcio)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00234-2024-0-1817-JR-FC-03'),
 'Completar inventario de bienes gananciales',
 'Reunir documentación de todos los bienes adquiridos durante el matrimonio',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2024-12-08',
 '2024-12-08',
 'alta'),
((SELECT id FROM procesos WHERE numero_proceso = '00234-2024-0-1817-JR-FC-03'),
 'Elaborar demanda de divorcio',
 'Redactar demanda con todos los fundamentos de hecho y derecho',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2024-12-15',
 '2024-12-15',
 'urgente'),
((SELECT id FROM procesos WHERE numero_proceso = '00234-2024-0-1817-JR-FC-03'),
 'Solicitar certificados registrales',
 'Obtener certificados de propiedad de inmuebles y vehículos',
 (SELECT id FROM estados_tarea WHERE nombre = 'por_asignar'),
 '2024-12-06',
 '2024-12-06',
 'alta');

-- Tareas para Proceso 5 (Penal)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00678-2024-0-1826-JR-PE-01'),
 'Preparar interrogatorio de testigos',
 'Elaborar cuestionario para testigos de cargo en juicio oral',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2024-12-15',
 '2024-12-15',
 'urgente'),
((SELECT id FROM procesos WHERE numero_proceso = '00678-2024-0-1826-JR-PE-01'),
 'Coordinar con perito contable',
 'Reunión con perito para afinar sustento de monto de reparación civil',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2024-12-12',
 '2024-12-12',
 'alta');

-- Tareas para Proceso 6 (Administrativo)
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-1234-PA'),
 'Presentar escrito de subsanación',
 'Subsanar observaciones formuladas por el Tribunal',
 (SELECT id FROM estados_tarea WHERE nombre = 'completada'),
 '2024-11-20',
 '2024-11-20',
 'urgente'),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-1234-PA'),
 'Realizar seguimiento de resolución',
 'Verificar estado del expediente y fecha probable de pronunciamiento',
 (SELECT id FROM estados_tarea WHERE nombre = 'en_curso'),
 '2024-12-05',
 '2024-12-05',
 'media');

-- Tareas vencidas para demostración
INSERT INTO tareas (proceso_id, nombre, descripcion, estado_id, fecha_limite, fecha_vencimiento, prioridad) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 'Revisar jurisprudencia sobre despido arbitrario',
 'Investigar sentencias recientes del Tribunal Constitucional sobre reposición laboral',
 (SELECT id FROM estados_tarea WHERE nombre = 'sin_empezar'),
 '2024-11-01',
 '2024-11-01',
 'media'),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 'Enviar carta notarial de requerimiento de pago',
 'Notificar al inquilino moroso antes de iniciar proceso judicial',
 (SELECT id FROM estados_tarea WHERE nombre = 'completada'),
 '2024-08-30',
 '2024-08-30',
 'alta');

-- ============================================================
-- IMPULSOS (RECORDATORIOS Y FECHAS IMPORTANTES)
-- ============================================================

-- Impulsos para los próximos días
INSERT INTO impulsos (proceso_id, titulo, descripcion, tipo, fecha_impulso, estado) VALUES
((SELECT id FROM procesos WHERE numero_proceso = '00123-2024-0-1801-JR-LA-10'),
 'Audiencia de Conciliación',
 'Audiencia programada en el 10° Juzgado de Trabajo - Sala 3',
 'audiencia',
 '2025-01-15 09:00:00',
 'activo'),
((SELECT id FROM procesos WHERE numero_proceso = '00678-2024-0-1826-JR-PE-01'),
 'Audiencia de Juicio Oral',
 'Continuación de juicio oral - Declaración de testigos',
 'audiencia',
 '2024-12-18 10:00:00',
 'activo'),
((SELECT id FROM procesos WHERE numero_proceso = '00456-2024-0-1801-JR-CI-05'),
 'Vence plazo para ofrecer pruebas',
 'Último día para presentar ofrecimiento de medios probatorios',
 'vencimiento',
 '2024-12-22 18:00:00',
 'activo'),
((SELECT id FROM procesos WHERE numero_proceso = 'EXP-2024-789'),
 'Seguimiento de laudo arbitral',
 'Contactar con Centro de Arbitraje PUCP',
 'recordatorio',
 '2024-12-05 15:00:00',
 'activo'),
((SELECT id FROM procesos WHERE numero_proceso = '00234-2024-0-1817-JR-FC-03'),
 'Reunión con cliente Carlos Ramírez',
 'Revisar documentación de bienes gananciales',
 'cita',
 '2024-12-10 16:00:00',
 'activo');

-- ============================================================
-- FIN DE DATOS INICIALES EXTENDIDOS
-- ============================================================