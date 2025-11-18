// supabase/functions/create-empleado-auth/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Función para verificar permisos de administrador
const verificarPermisosAdmin = async (supabaseAdmin, authUserId)=>{
  try {
    const { data, error } = await supabaseAdmin.from('empleados').select('rol:roles_empleados(permisos)').eq('auth_user_id', authUserId).single();
    if (error || !data) return false;
    const permisos = data.rol?.permisos;
    return !!(permisos?.all === true || permisos?.empleados === 'full' || permisos?.administracion === 'full');
  } catch (error) {
    console.error('Error en verificación de permisos:', error);
    return false;
  }
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header es requerido');
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Token inválido o expirado');
    }
    const tienePermisos = await verificarPermisosAdmin(supabaseAdmin, user.id);
    if (!tienePermisos) {
      throw new Error('No tiene permisos de administrador para realizar esta acción');
    }
    const requestData = await req.json();
    const { action = 'create' } = requestData;
    if (action === 'create') {
      // Crear usuario Auth
      const { email, password, nombre, apellido } = requestData;
      if (!email) throw new Error('Email es requerido');
      if (!password) throw new Error('Password es requerido para crear usuario');
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellido,
          tipo: 'empleado'
        }
      });
      if (error) throw error;
      // Registrar en tabla de auditoría
      await supabaseAdmin.from('historial_cambios').insert({
        tabla: 'auth.users',
        registro_id: newUser.user.id,
        empleado_id: user.id,
        accion: 'CREAR_USUARIO_EMPLEADO',
        datos_anteriores: null,
        datos_nuevos: {
          email,
          nombre,
          apellido,
          tipo: 'empleado'
        }
      });
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } else if (action === 'delete') {
      // Eliminar usuario Auth
      const { userId } = requestData;
      if (!userId) throw new Error('userId es requerido');
      console.log('Eliminando usuario Auth:', userId);
      // Obtener información del usuario antes de eliminarlo
      const { data: userBefore, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (getError) {
        console.log('Usuario no encontrado, puede que ya haya sido eliminado');
      // Continuar aunque no exista
      }
      // Eliminar usuario Auth
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        // Si el error es que el usuario no existe, lo consideramos éxito
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log('Usuario ya no existe, considerando como éxito');
        } else {
          throw error;
        }
      }
      // Registrar en tabla de auditoría
      await supabaseAdmin.from('historial_cambios').insert({
        tabla: 'auth.users',
        registro_id: userId,
        empleado_id: user.id,
        accion: 'ELIMINAR_USUARIO_EMPLEADO',
        datos_anteriores: userBefore ? {
          email: userBefore.user.email,
          created_at: userBefore.user.created_at
        } : null,
        datos_nuevos: null
      });
      return new Response(JSON.stringify({
        success: true,
        message: 'Usuario Auth eliminado correctamente'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } else {
      throw new Error('Acción no válida');
    }
  } catch (error) {
    console.error('Error en create-empleado-auth:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
