# ⚖️ Sistema Legal - Gestión de Procesos Legales

Sistema completo de gestión legal construido con Next.js 16 y Supabase, diseñado para estudios jurídicos y departamentos legales.

## 🚀 Inicio Rápido

**¿Primera vez configurando el sistema?** 👉 Sigue la [Guía de Configuración Completa](SETUP.md)

### Checklist de Configuración

- [ ] 1. Crear proyecto en Supabase
- [ ] 2. Copiar credenciales a `.env.local`
- [ ] 3. Ejecutar `supabase/schema.sql`
- [ ] 4. Ejecutar `supabase/seeds.sql`
- [ ] 5. Crear usuario en Supabase Auth con `aldair0624@gmail.com`
- [ ] 6. Ejecutar `supabase/insert_admin_user.sql`
- [ ] 7. Iniciar servidor con `npm run dev`
- [ ] 8. Hacer login en http://localhost:3000

## 🎯 Características

- ✅ **Autenticación y Autorización**: Sistema completo con roles y permisos
- ✅ **Gestión de Procesos**: Seguimiento completo de casos legales
- ✅ **Gestión de Clientes**: Base de datos de clientes con múltiples contactos
- ✅ **Gestión de Empleados**: Administración de equipo legal
- ✅ **Sistema de Tareas**: Asignación y seguimiento de tareas
- ✅ **Impulsos (Recordatorios)**: Sistema de alertas y vencimientos
- ✅ **Documentos**: Gestión de archivos por proceso
- ✅ **Historial de Cambios**: Auditoría completa de modificaciones
- ✅ **Dashboard**: Visualización de estadísticas y métricas clave

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (App Router), React 19, JavaScript
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS v4
- **Iconos**: Lucide React
- **Utilidades**: date-fns, clsx, tailwind-merge

## 📁 Estructura del Proyecto

```
sistema-legal/
├── app/
│   ├── (auth)/           # Páginas de autenticación
│   │   └── login/        # Página de login
│   ├── (dashboard)/      # Páginas protegidas
│   │   ├── dashboard/    # Panel principal
│   │   ├── procesos/     # Gestión de procesos
│   │   ├── clientes/     # Gestión de clientes
│   │   ├── empleados/    # Gestión de empleados
│   │   ├── tareas/       # Gestión de tareas
│   │   └── impulsos/     # Gestión de impulsos
│   ├── api/              # API Routes
│   ├── globals.css       # Estilos globales
│   ├── layout.js         # Layout principal
│   └── page.js           # Página de inicio
├── components/           # Componentes reutilizables
├── hooks/                # Custom hooks
│   └── useAuth.js        # Hook de autenticación
├── lib/
│   ├── supabase.js       # Cliente de Supabase
│   ├── services.js       # Servicios de base de datos
│   └── utils.js          # Funciones auxiliares
├── supabase/
│   ├── schema.sql        # Esquema de base de datos
│   ├── seeds.sql         # Datos iniciales
│   ├── insert_admin_user.sql  # Script de usuario admin
│   ├── README.md         # Documentación de BD
│   └── DIAGRAMA.md       # Diagrama de relaciones
├── types/                # Constantes y tipos
├── middleware.js         # Protección de rutas
├── SETUP.md             # Guía de configuración
└── PROYECTO.md          # Documentación del proyecto
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor en http://localhost:3000

# Producción
npm run build        # Construye la aplicación
npm run start        # Inicia servidor de producción

# Utilidades
npm run lint         # Ejecuta ESLint
```

## 📊 Base de Datos

El sistema utiliza PostgreSQL con 17 tablas principales:

1. **roles_empleados** - Roles y permisos del sistema
2. **empleados** - Usuarios del sistema
3. **clientes** - Base de datos de clientes
4. **contactos_clientes** - Contactos de cada cliente
5. **procesos** - Casos legales
6. **actualizaciones_proceso** - Historial de actualizaciones
7. **proceso_empleados** - Asignación de empleados a procesos
8. **tareas** - Tareas del sistema
9. **impulsos** - Recordatorios y vencimientos
10. **documentos** - Archivos adjuntos
11. **comentarios** - Comentarios en procesos
12. **historial_cambios** - Auditoría completa

Más 5 tablas de catálogos (estados, materias, tipos, etc.)

Ver [supabase/README.md](supabase/README.md) para documentación completa.

## 🔐 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** basadas en roles
- **Middleware** protegiendo rutas del dashboard
- **Permisos granulares** configurables por rol
- **Auditoría completa** de cambios con triggers

## 👥 Roles del Sistema

1. **Admin** - Acceso completo al sistema
2. **Abogado Senior** - Gestión completa de procesos
3. **Abogado Junior** - Gestión limitada de procesos
4. **Asistente Legal** - Apoyo en tareas y documentos

## 📝 Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 📞 Soporte

Para problemas o preguntas, consulta [SETUP.md](SETUP.md) o contacta al administrador del sistema.

---

**Desarrollado con ❤️ para la gestión legal eficiente**
