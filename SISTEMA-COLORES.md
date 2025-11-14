# Sistema de Colores - #0091FF

## Color Primario

El color principal del sistema es **#0091FF** (Azul brillante). Este es el color que define la identidad visual de la aplicación.

## Paleta de Colores

La paleta está basada en variaciones del color primario #0091FF, creando un sistema coherente y profesional:

| Color           | Código Hex | Uso Recomendado                                        |
| --------------- | ---------- | ------------------------------------------------------ |
| **primary-50**  | #e6f7ff    | Fondos muy claros, hover suaves                        |
| **primary-100** | #bae7ff    | Fondos claros, badges secundarios                      |
| **primary-200** | #91d5ff    | Bordes suaves, estados disabled                        |
| **primary-300** | #69c0ff    | Bordes activos, divisores                              |
| **primary-400** | #40a9ff    | Rings de focus, bordes hover                           |
| **primary-500** | #1890ff    | Botones secundarios                                    |
| **primary-600** | #0091ff    | **COLOR PRIMARIO - Botones, links, elementos activos** |
| **primary-700** | #096dd9    | Hover en botones primarios                             |
| **primary-800** | #0050b3    | Texto en fondos claros, estados pressed                |
| **primary-900** | #003a8c    | Texto oscuro sobre fondos azules                       |
| **primary-950** | #002766    | Texto muy oscuro, títulos importantes                  |

## Uso con Tailwind CSS

### Clases de Texto

```jsx
<p className="text-primary-600">Texto en azul primario</p>
<p className="text-primary-800">Texto más oscuro</p>
<h1 className="text-primary-950">Título importante</h1>
```

### Clases de Fondo

```jsx
<div className="bg-primary-50">Fondo muy claro</div>
<button className="bg-primary-600 hover:bg-primary-700">Botón primario</button>
<span className="bg-primary-100 text-primary-800">Badge</span>
```

### Clases de Borde

```jsx
<input className="border-primary-400 focus:ring-primary-400" />
<div className="border-2 border-primary-600">Card destacado</div>
```

## Colores del Sistema (CSS Variables)

Estos colores se ajustan automáticamente y usan el azul #0091FF como base:

- `bg-primary` / `text-primary` - Color primario principal (#0091FF)
- `bg-secondary` / `text-secondary` - Azul muy claro para fondos secundarios
- `bg-muted` / `text-muted-foreground` - Grises neutros
- `bg-accent` / `text-accent-foreground` - Azul claro para hover
- `bg-destructive` / `text-destructive-foreground` - Rojo para acciones peligrosas

## Ejemplos de Uso

### Botones

```jsx
// Primario
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Acción Principal
</button>

// Secundario
<button className="bg-primary-100 hover:bg-primary-200 text-primary-800">
  Acción Secundaria
</button>

// Outline
<button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50">
  Outline
</button>
```

### Badges/Pills

```jsx
// Badge con fondo claro
<span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full text-xs">
  Activo
</span>

// Badge con fondo oscuro
<span className="bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
  Importante
</span>
```

### Cards con Hover

```jsx
<div className="border border-primary-200 hover:border-primary-400 rounded-lg transition-colors">
  Card con efecto hover
</div>
```

### Links

```jsx
<a className="text-primary-600 hover:text-primary-700 underline">Enlace</a>
```

### Tablas (Estilo actual)

```jsx
// Row hover
<tr className="hover:bg-primary-50">

// Cell activo/seleccionado
<td className="bg-primary-50 ring-2 ring-primary-400">

// Iconos con hover
<icon className="text-gray-300 hover:text-primary-600" />
```

### Alertas/Banners

```jsx
// Info banner
<div className="bg-primary-50 border border-primary-200 text-primary-900">
  Mensaje informativo
</div>

// Destacado
<div className="bg-primary-600 text-white p-4">
  Mensaje importante
</div>
```

## Mejores Prácticas

1. **Color Primario (#0091FF)**: Usar para acciones principales, links, y elementos interactivos importantes
2. **Tonos Claros (50-200)**: Fondos, hover states, badges secundarios
3. **Tonos Medios (300-500)**: Bordes, divisores, estados intermedios
4. **Tonos Oscuros (600-800)**: Botones, texto sobre fondos claros
5. **Tonos Muy Oscuros (900-950)**: Texto importante, títulos, sobre fondos azules claros

## Contraste y Accesibilidad

- **Texto blanco** sobre: primary-600, primary-700, primary-800, primary-900, primary-950
- **Texto oscuro (primary-800/900)** sobre: primary-50, primary-100, primary-200
- **Texto primary-600** sobre: fondos blancos o muy claros

## Modo Oscuro

El sistema incluye soporte para modo oscuro que mantiene el azul #0091FF como color primario con ajustes automáticos para contraste.

## Migración de Colores Antiguos

Si encuentras clases con nombres antiguos, aquí está la conversión:

- `dodger-blue-*` → `primary-*`
- `blue-600` → `primary-600`
- `blue-50` → `primary-50`
- etc.

---

**Color principal: #0091FF**  
_Sistema actualizado: Noviembre 2025_
