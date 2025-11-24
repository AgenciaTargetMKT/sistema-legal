# 📁 Estructura del Proyecto - Sistema Legal

## 🎯 Guía de Arquitectura Next.js 13+ (App Router)

Este proyecto sigue las mejores prácticas de Next.js con App Router, organizado para escalabilidad y mantenibilidad.

---

## 📂 Estructura Completa

```
.
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.jsx
│   │
│   ├── (protected)/
│   │   ├── layout.jsx
│   │   ├── template.jsx
│   │   │
│   │   ├── home/
│   │   │   └── page.jsx
│   │   ├── calendario/
│   │   │   └── page.jsx
│   │   ├── clientes/
│   │   │   └── page.jsx
│   │   ├── empleados/
│   │   │   └── page.jsx
│   │   ├── impulsos/
│   │   │   └── page.jsx
│   │   ├── procesos/
│   │   │   └── page.jsx
│   │   └── tareas/
│   │       └── page.jsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.js
│   │   ├── calendario/
│   │   │   └── route.js
│   │   ├── consulta-dni/
│   │   │   └── route.js
│   │   ├── consulta-ruc/
│   │   │   └── route.js
│   │   ├── clientes/
│   │   │   └── route.js
│   │   ├── empleados/
│   │   │   └── route.js
│   │   ├── procesos/
│   │   │   └── route.js
│   │   └── tareas/
│   │       └── route.js
│   │
│   ├── globals.css
│   ├── layout.js
│   └── page.js
│
├── components/
│   ├── ui/
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   └── index.js
│   │
│   ├── layout/
│   │   ├── header.jsx
│   │   ├── sidebar.jsx
│   │   ├── user-menu.jsx
│   │   └── index.js
│   │
│   ├── providers/
│   │   ├── auth-provider.jsx
│   │   ├── next-auth-provider.jsx
│   │   ├── toast-provider.jsx
│   │   └── index.js
│   │
│   ├── features/
│   │   ├── calendario/
│   │   │   ├── calendar-popover.jsx
│   │   │   ├── event-dialog.jsx
│   │   │   ├── full-calendar-widget.jsx
│   │   │   ├── google-calendar-widget.jsx
│   │   │   ├── today-day-view.jsx
│   │   │   ├── today-events-widget.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── clientes/
│   │   │   └── cliente-dialog.jsx
│   │   ├── empleados/
│   │   │   └── empleado-dialog.jsx
│   │   ├── procesos/
│   │   │   └── procesos-table.jsx
│   │   └── tareas/
│   │       └── tareas-table.jsx
│   │
│   └── tables/
│       ├── editable/
│       │   ├── ColumnHeader.jsx
│       │   ├── ProcesoPanel.jsx
│       │   ├── ProcesosTable.jsx
│       │   ├── TareaPanel.jsx
│       │   ├── TareasTable.jsx
│       │   └── index.js
│       └── index.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useToast.js
│   ├── useSidebar.js
│   └── useFetch.js
│
├── lib/
│   ├── services.js
│   ├── store.js
│   ├── supabase.js
│   └── utils.js
│
├── types/
│   ├── cliente.d.ts
│   ├── empleado.d.ts
│   ├── proceso.d.ts
│   ├── tarea.d.ts
│   └── index.d.ts
│
└── package.json
```

---

## 📝 Descripción de Carpetas

### 🔷 `/app` - Next.js App Router

#### `(auth)` - Grupo de Rutas Públicas

Rutas accesibles sin autenticación:

- `/login` - Página de inicio de sesión

#### `(protected)` - Grupo de Rutas Protegidas

Todas las rutas dentro requieren autenticación. Comparten:

- **layout.jsx** - Layout con Sidebar + Header
- **template.jsx** - Para animaciones de transición entre páginas

**Rutas disponibles:**

- `/home` - Dashboard principal (redirige desde `/`)
- `/calendario` - Gestión de eventos y calendario
- `/clientes` - CRUD de clientes
- `/empleados` - CRUD de empleados
- `/impulsos` - Gestión de impulsos procesales
- `/procesos` - Gestión de procesos legales
- `/tareas` - Sistema de tareas y seguimiento

#### `api/` - API Routes

Endpoints backend organizados por recurso:

- `auth/` - Autenticación con NextAuth.js
- `calendario/` - Endpoints de eventos
- `consulta-dni/` - Integración con RENIEC
- `consulta-ruc/` - Integración con SUNAT
- `clientes/`, `empleados/`, `procesos/`, `tareas/` - CRUD APIs

#### Archivos raíz de `/app`

- **globals.css** - Estilos globales, variables CSS, tema
- **layout.js** - Root layout con providers globales
- **page.js** - Página raíz (redirige a `/home`)

---

### 🔷 `/components` - Componentes Reutilizables

#### `ui/` - Componentes Base

Componentes UI fundamentales y reutilizables:

- **button.jsx** - Botón con variantes
- **card.jsx** - Card component
- **dialog.jsx** - Modal/Dialog
- **input.jsx** - Input de texto
- **label.jsx** - Label para forms
- **index.js** - Exports centralizados

**Import recomendado:**

```javascript
import { Button, Input, Label } from "@/components/ui";
```

#### `layout/` - Componentes de Layout

Componentes estructurales del dashboard:

- **header.jsx** - Header global con menú de usuario
- **sidebar.jsx** - Navegación lateral
- **user-menu.jsx** - Menú de perfil de usuario
- **index.js** - Exports centralizados

**Import recomendado:**

```javascript
import { Header, Sidebar } from "@/components/layout";
```

#### `providers/` - Context Providers

Proveedores de contexto para toda la app:

- **auth-provider.jsx** - Manejo de autenticación
- **next-auth-provider.jsx** - Wrapper de NextAuth
- **toast-provider.jsx** - Sistema de notificaciones
- **index.js** - Exports centralizados

**Import recomendado:**

```javascript
import { AuthProvider, ToastProvider } from "@/components/providers";
```

#### `features/` - Componentes por Feature

Componentes específicos organizados por funcionalidad:

**📅 calendario/** - Sistema de calendario

- calendar-popover.jsx
- event-dialog.jsx
- full-calendar-widget.jsx
- google-calendar-widget.jsx
- today-day-view.jsx
- today-events-widget.jsx
- index.js

**👥 clientes/** - Gestión de clientes

- cliente-dialog.jsx

**👔 empleados/** - Gestión de empleados

- empleado-dialog.jsx

**⚖️ procesos/** - Gestión de procesos legales

- procesos-table.jsx

**✅ tareas/** - Sistema de tareas

- tareas-table.jsx

**Import recomendado:**

```javascript
import { FullCalendarWidget } from "@/components/features/calendario";
import ClienteDialog from "@/components/features/clientes/cliente-dialog";
```

#### `tables/` - Componentes de Tablas

Tablas especializadas:

**editable/** - Tablas con edición inline

- ColumnHeader.jsx - Headers personalizados
- ProcesoPanel.jsx - Panel lateral de procesos
- ProcesosTable.jsx - Tabla de procesos editable
- TareaPanel.jsx - Panel lateral de tareas
- TareasTable.jsx - Tabla de tareas editable
- index.js - Exports centralizados

**Import recomendado:**

```javascript
import { ProcesosTable, TareasTable } from "@/components/tables/editable";
```

---

### 🔷 `/hooks` - Custom React Hooks

Hooks reutilizables para lógica compartida:

- **useAuth.js** - Hook de autenticación y gestión de usuario

**Uso:**

```javascript
import { useAuth } from "@/hooks/useAuth";
const { user, isLoading } = useAuth();
```

**Nota:** Puedes agregar más hooks según necesites (useToast, useFetch, etc.)

---

### 🔷 `/lib` - Utilidades, Servicios y Configuración

Lógica de negocio, configuración y funciones utilitarias:

- **services.js** - Capa de servicios con CRUD para todas las entidades (clientes, empleados, procesos, tareas, calendario)
- **store.js** - Zustand store para gestión de estado global
- **supabase.js** - Cliente de Supabase configurado
- **utils.js** - Funciones helper generales (formateo, validaciones, etc.)

**Ejemplo de uso:**

```javascript
// Importar servicios desde lib/services.js
import { clientesService } from "@/lib/services";

const clientes = await clientesService.getAll();
```

---

### 🔷 `/types` - Definiciones TypeScript

Tipos e interfaces (si usas TypeScript):

- **cliente.d.ts** - Tipos de cliente
- **empleado.d.ts** - Tipos de empleado
- **proceso.d.ts** - Tipos de proceso
- **tarea.d.ts** - Tipos de tarea
- **index.d.ts** - Exports centralizados

---

## 🎨 Convenciones de Código

### Nombres de Archivos

- **Componentes**: PascalCase o kebab-case → `Button.jsx` o `button.jsx`
- **Hooks**: camelCase con prefijo `use` → `useAuth.js`
- **Servicios**: kebab-case con sufijo `.service` → `clientes.service.js`
- **Tipos**: kebab-case con extensión `.d.ts` → `cliente.d.ts`

### Imports

**Preferir imports desde index.js:**

```javascript
// ✅ Bueno
import { Button, Input } from "@/components/ui";

// ❌ Evitar (pero válido si es necesario)
import Button from "@/components/ui/button";
```

### Estructura de Componentes

```javascript
// 1. Imports externos
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Imports internos
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

// 3. Tipos (si TypeScript)
import type { Cliente } from "@/types";

// 4. Componente
export function MiComponente() {
  // ...
}
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Linting
npm run lint

# Formateo (si tienes Prettier)
npm run format
```

---

## 📋 Checklist para Nuevos Features

Al agregar una nueva funcionalidad:

- [ ] **Crear página** en `app/(protected)/[feature]/page.jsx`
- [ ] **Crear componentes** en `components/features/[feature]/`
- [ ] **Agregar servicios** en `lib/services.js` para la nueva feature
- [ ] **Crear API routes** en `app/api/[feature]/route.js`
- [ ] **Exportar en index.js** de la carpeta de componentes
- [ ] **Agregar ruta** en `components/layout/sidebar.jsx`
- [ ] **Actualizar tipos** (si usas TypeScript) en `types/[feature].d.ts`

---

## 🔐 Protección de Rutas

- **Públicas**: Carpeta `(auth)/`
- **Protegidas**: Carpeta `(protected)/` con layout que verifica sesión
- **API**: Middleware en `middleware.js` o verificación en cada route

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + CSS Variables
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js / Supabase Auth
- **Forms**: React Hook Form + Zod
- **UI Base**: shadcn/ui (personalizado)

---

## 📞 Soporte

Para dudas sobre la estructura, revisa:

1. Este archivo (`ESTRUCTURA_PROYECTO.md`)
2. Comentarios en `app/layout.js`
3. Componentes de ejemplo en `components/features/`

---

**Última actualización**: 24 de noviembre de 2025  
**Versión de estructura**: 2.0  
**Mantenedor**: Equipo Sistema Legal

```

```
