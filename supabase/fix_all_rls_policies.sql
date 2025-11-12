-- ============================================
-- POLÍTICAS RLS PARA TODAS LAS TABLAS DEL SISTEMA
-- Ejecuta este script en Supabase SQL Editor para habilitar acceso completo
-- ============================================

-- ========== TABLA: clientes ==========
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select_all" ON clientes;
DROP POLICY IF EXISTS "clientes_insert_all" ON clientes;
DROP POLICY IF EXISTS "clientes_update_all" ON clientes;
DROP POLICY IF EXISTS "clientes_delete_all" ON clientes;

CREATE POLICY "clientes_select_all" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert_all" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update_all" ON clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_delete_all" ON clientes FOR DELETE TO authenticated USING (true);

-- ========== TABLA: materias ==========
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materias_select_all" ON materias;
DROP POLICY IF EXISTS "materias_insert_all" ON materias;
DROP POLICY IF EXISTS "materias_update_all" ON materias;
DROP POLICY IF EXISTS "materias_delete_all" ON materias;

CREATE POLICY "materias_select_all" ON materias FOR SELECT TO authenticated USING (true);
CREATE POLICY "materias_insert_all" ON materias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materias_update_all" ON materias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "materias_delete_all" ON materias FOR DELETE TO authenticated USING (true);

-- ========== TABLA: estados_proceso ==========
ALTER TABLE estados_proceso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estados_proceso_select_all" ON estados_proceso;
DROP POLICY IF EXISTS "estados_proceso_insert_all" ON estados_proceso;
DROP POLICY IF EXISTS "estados_proceso_update_all" ON estados_proceso;
DROP POLICY IF EXISTS "estados_proceso_delete_all" ON estados_proceso;

CREATE POLICY "estados_proceso_select_all" ON estados_proceso FOR SELECT TO authenticated USING (true);
CREATE POLICY "estados_proceso_insert_all" ON estados_proceso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "estados_proceso_update_all" ON estados_proceso FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "estados_proceso_delete_all" ON estados_proceso FOR DELETE TO authenticated USING (true);

-- ========== TABLA: tipos_proceso ==========
ALTER TABLE tipos_proceso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipos_proceso_select_all" ON tipos_proceso;
DROP POLICY IF EXISTS "tipos_proceso_insert_all" ON tipos_proceso;
DROP POLICY IF EXISTS "tipos_proceso_update_all" ON tipos_proceso;
DROP POLICY IF EXISTS "tipos_proceso_delete_all" ON tipos_proceso;

CREATE POLICY "tipos_proceso_select_all" ON tipos_proceso FOR SELECT TO authenticated USING (true);
CREATE POLICY "tipos_proceso_insert_all" ON tipos_proceso FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tipos_proceso_update_all" ON tipos_proceso FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tipos_proceso_delete_all" ON tipos_proceso FOR DELETE TO authenticated USING (true);

-- ========== TABLA: procesos ==========
ALTER TABLE procesos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "procesos_select_all" ON procesos;
DROP POLICY IF EXISTS "procesos_insert_all" ON procesos;
DROP POLICY IF EXISTS "procesos_update_all" ON procesos;
DROP POLICY IF EXISTS "procesos_delete_all" ON procesos;

CREATE POLICY "procesos_select_all" ON procesos FOR SELECT TO authenticated USING (true);
CREATE POLICY "procesos_insert_all" ON procesos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "procesos_update_all" ON procesos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "procesos_delete_all" ON procesos FOR DELETE TO authenticated USING (true);

-- ========== TABLA: tareas ==========
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tareas_select_all" ON tareas;
DROP POLICY IF EXISTS "tareas_insert_all" ON tareas;
DROP POLICY IF EXISTS "tareas_update_all" ON tareas;
DROP POLICY IF EXISTS "tareas_delete_all" ON tareas;

CREATE POLICY "tareas_select_all" ON tareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "tareas_insert_all" ON tareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tareas_update_all" ON tareas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tareas_delete_all" ON tareas FOR DELETE TO authenticated USING (true);

-- ========== TABLA: estados_tarea ==========
ALTER TABLE estados_tarea ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estados_tarea_select_all" ON estados_tarea;
DROP POLICY IF EXISTS "estados_tarea_insert_all" ON estados_tarea;
DROP POLICY IF EXISTS "estados_tarea_update_all" ON estados_tarea;
DROP POLICY IF EXISTS "estados_tarea_delete_all" ON estados_tarea;

CREATE POLICY "estados_tarea_select_all" ON estados_tarea FOR SELECT TO authenticated USING (true);
CREATE POLICY "estados_tarea_insert_all" ON estados_tarea FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "estados_tarea_update_all" ON estados_tarea FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "estados_tarea_delete_all" ON estados_tarea FOR DELETE TO authenticated USING (true);

-- ========== TABLA: empleados ==========
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empleados_select_all" ON empleados;
DROP POLICY IF EXISTS "empleados_insert_all" ON empleados;
DROP POLICY IF EXISTS "empleados_update_all" ON empleados;
DROP POLICY IF EXISTS "empleados_delete_all" ON empleados;

CREATE POLICY "empleados_select_all" ON empleados FOR SELECT TO authenticated USING (true);
CREATE POLICY "empleados_insert_all" ON empleados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "empleados_update_all" ON empleados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "empleados_delete_all" ON empleados FOR DELETE TO authenticated USING (true);

-- ========== VERIFICACIÓN ==========
-- Ver todas las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN (
    'clientes', 'materias', 'estados_proceso', 'tipos_proceso',
    'procesos', 'tareas', 'estados_tarea', 'empleados'
)
ORDER BY tablename, policyname;

-- ============================================
-- ✅ POLÍTICAS RLS HABILITADAS PARA:
-- - clientes
-- - materias  
-- - estados_proceso
-- - tipos_proceso
-- - procesos
-- - tareas
-- - estados_tarea
-- - empleados
--
-- Todos los usuarios autenticados tienen acceso completo (SELECT, INSERT, UPDATE, DELETE)
-- ============================================
