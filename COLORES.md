# 🎨 Paleta de Colores Dodger Blue

## Colores Disponibles

Tu sistema ahora usa la paleta **Dodger Blue** como tema principal. Aquí te explico cómo usarla:

### 📋 Paleta Completa

```css
--dodger-blue-50:  #edfcff  /* Más claro - fondos sutiles */
--dodger-blue-100: #d6f6ff  /* Muy claro - hover states */
--dodger-blue-200: #b5f1ff  /* Claro - borders */
--dodger-blue-300: #83eaff  /* Claro medio */
--dodger-blue-400: #48dbff  /* Medio claro */
--dodger-blue-500: #1ec0ff  /* Base - botones secundarios */
--dodger-blue-600: #06a4ff  /* Principal - botones primarios */
--dodger-blue-700: #0091ff  /* Oscuro - hover en botones */
--dodger-blue-800: #086ec5  /* Más oscuro - texto sobre claro */
--dodger-blue-900: #0d5e9b  /* Muy oscuro - texto importante */
--dodger-blue-950: #0e385d  /* Oscurísimo - texto principal */
```

## 🎯 Uso en Tailwind CSS

### Colores de texto

```jsx
<div className="text-dodger-blue-600">Texto azul principal</div>
<div className="text-dodger-blue-800">Texto azul oscuro</div>
<div className="text-dodger-blue-950">Texto casi negro</div>
```

### Fondos

```jsx
<div className="bg-dodger-blue-50">Fondo muy claro</div>
<div className="bg-dodger-blue-600">Fondo azul vibrante</div>
<div className="bg-dodger-blue-900">Fondo azul oscuro</div>
```

### Bordes

```jsx
<div className="border border-dodger-blue-200">Borde claro</div>
<div className="border-2 border-dodger-blue-600">Borde principal</div>
```

### Hover states

```jsx
<button className="bg-dodger-blue-600 hover:bg-dodger-blue-700">
  Botón con hover
</button>
```

### Ring (focus)

```jsx
<input className="ring-2 ring-dodger-blue-600 focus:ring-dodger-blue-700" />
```

## 🎨 Colores del Sistema (Variables CSS)

Estos colores ya están configurados automáticamente:

- `bg-primary` → Dodger Blue 600
- `text-primary` → Blanco sobre azul
- `bg-secondary` → Dodger Blue 700
- `bg-muted` → Dodger Blue 100
- `text-muted-foreground` → Dodger Blue 900

### Ejemplos con variables del sistema

```jsx
<button className="bg-primary text-primary-foreground">
  Botón Primario
</button>

<div className="bg-secondary text-secondary-foreground">
  Contenido Secundario
</div>

<div className="bg-muted text-muted-foreground">
  Texto Silenciado
</div>
```

## 💡 Guía de Uso Recomendada

### Botones

```jsx
// Botón principal
<button className="bg-dodger-blue-600 hover:bg-dodger-blue-700 text-white">
  Guardar
</button>

// Botón secundario
<button className="bg-dodger-blue-100 hover:bg-dodger-blue-200 text-dodger-blue-800">
  Cancelar
</button>

// Botón outline
<button className="border-2 border-dodger-blue-600 text-dodger-blue-600 hover:bg-dodger-blue-50">
  Editar
</button>
```

### Badges/Pills

```jsx
<span className="bg-dodger-blue-100 text-dodger-blue-800 px-3 py-1 rounded-full">
  Activo
</span>

<span className="bg-dodger-blue-600 text-white px-3 py-1 rounded-full">
  Nuevo
</span>
```

### Cards

```jsx
<div className="bg-white border border-dodger-blue-200 hover:border-dodger-blue-400">
  <h3 className="text-dodger-blue-900">Título</h3>
  <p className="text-dodger-blue-800">Contenido</p>
</div>
```

### Links

```jsx
<a className="text-dodger-blue-600 hover:text-dodger-blue-700 underline">
  Ver más
</a>
```

### Iconos

```jsx
import { FileText } from "lucide-react";

<FileText className="text-dodger-blue-600 h-5 w-5" />
<FileText className="text-dodger-blue-300 hover:text-dodger-blue-600 h-5 w-5" />
```

### Tablas (como las que ya tienes)

```jsx
// Hover en filas
<tr className="hover:bg-dodger-blue-50">

// Celda seleccionada
<td className="bg-dodger-blue-100 ring-2 ring-dodger-blue-400">

// Icono de acción
<button className="text-dodger-blue-300 hover:text-dodger-blue-600">
  <PanelRightOpen />
</button>
```

## 🌙 Modo Oscuro (futuro)

Puedes agregar variantes para modo oscuro más adelante:

```jsx
<div className="bg-dodger-blue-600 dark:bg-dodger-blue-800">
  Adaptable a modo oscuro
</div>
```

## 📝 Notas Importantes

1. **Consistencia**: Usa siempre los mismos tonos para las mismas acciones:

   - `dodger-blue-600`: Acciones principales
   - `dodger-blue-50-100`: Fondos sutiles
   - `dodger-blue-800-900`: Texto sobre fondos claros

2. **Contraste**: Asegúrate de tener buen contraste:

   - Texto oscuro (800-950) sobre fondos claros (50-200)
   - Texto blanco sobre fondos oscuros (600-950)

3. **Hover States**: Usa tonos +100 más oscuros para hover:
   - `bg-dodger-blue-600` → `hover:bg-dodger-blue-700`

## 🔄 Migración

Para actualizar componentes existentes que usen colores antiguos:

```jsx
// Antes
className = "bg-blue-600";
className = "text-blue-900";

// Después
className = "bg-dodger-blue-600";
className = "text-dodger-blue-900";
```

---

**¡Tu paleta está lista para usar!** 🎉

Todos los colores están disponibles con el prefijo `dodger-blue-` seguido del número (50, 100, 200... 950).
