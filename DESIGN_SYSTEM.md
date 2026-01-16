# Design System - Portfolio Raúl Fernández

## Filosofía Visual

**Estilo:** Minimalista profesional con acentos cálidos
**Inspiración principal:** Weaverly - Clean, enterprise, sophisticated

### Principios de Diseño

1. **Espacio en blanco generoso** - Dejar respirar los elementos
2. **Tipografía como protagonista** - Headlines grandes y bold
3. **Elementos visuales abstractos** - Blob/mesh gradient como arte visual
4. **Jerarquía clara** - Información fácil de escanear
5. **Profesionalismo sobrio** - Sin efectos decorativos innecesarios

---

## Paleta de Colores

### Colores de Fondo y Superficie

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Background** | `#FAFAFA` | Fondo principal (casi blanco) |
| **Surface** | `#FFFFFF` | Cards, contenedores, nav |
| **Surface Alt** | `#F5F5F5` | Secciones alternadas |

### Colores de Texto

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Text Primary** | `#0A0A0A` | Títulos, texto principal |
| **Text Secondary** | `#525252` | Subtítulos, descripciones |
| **Text Muted** | `#737373` | Labels, metadata, captions |
| **Text Light** | `#A3A3A3` | Placeholders, hints |

### Colores de Acento (Paleta Cálida)

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Orange Primary** | `#F67300` | CTAs, enlaces hover, acentos principales |
| **Orange Light** | `#FFEAA8` | Highlights suaves, badges |
| **Orange Warm** | `#FF8C42` | Variante para gradientes |

### Colores para Blob/Mesh Gradient

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Gradient Blue** | `#4A90D9` | Inicio del blob gradient |
| **Gradient Teal** | `#7BB3E0` | Transición intermedia |
| **Gradient Orange** | `#F67300` | Final del blob gradient |
| **Gradient Peach** | `#FFB088` | Highlights cálidos |

### Colores Neutros (Bordes)

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Border Light** | `#E5E5E5` | Bordes sutiles |
| **Border** | `#D4D4D4` | Bordes visibles |
| **Divider** | `#F5F5F5` | Separadores de sección |

---

## Variables CSS

```css
:root {
  /* Fondos */
  --bg-primary: #FAFAFA;
  --bg-surface: #FFFFFF;
  --bg-surface-alt: #F5F5F5;

  /* Texto */
  --text-primary: #0A0A0A;
  --text-secondary: #525252;
  --text-muted: #737373;
  --text-light: #A3A3A3;

  /* Acentos */
  --accent-orange: #F67300;
  --accent-orange-light: #FFEAA8;
  --accent-orange-warm: #FF8C42;

  /* Gradientes */
  --gradient-blue: #4A90D9;
  --gradient-teal: #7BB3E0;
  --gradient-orange: #F67300;

  /* Bordes */
  --border-light: #E5E5E5;
  --border: #D4D4D4;
  --divider: #F5F5F5;

  /* Sombras (muy sutiles) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

---

## Tipografía

### Fuente Principal: Inter Tight

```css
font-family: 'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif;
```

**Nota:** Inter Tight es la fuente ideal. Inter (ya instalada) funciona como fallback.

### Escala Tipográfica

| Elemento | Desktop | Mobile | Peso | Line Height | Tracking |
|----------|---------|--------|------|-------------|----------|
| **Display** | 80px | 48px | 700 | 0.95 | -0.03em |
| **Hero Title** | 64px | 40px | 700 | 1.0 | -0.025em |
| **Section Title** | 48px | 32px | 600 | 1.1 | -0.02em |
| **Card Title** | 24px | 20px | 600 | 1.3 | -0.01em |
| **Body Large** | 20px | 18px | 400 | 1.6 | 0 |
| **Body** | 16px | 16px | 400 | 1.6 | 0 |
| **Caption** | 14px | 14px | 500 | 1.5 | 0 |
| **Label** | 12px | 12px | 500 | 1.4 | 0.02em |

### Clases Tailwind

```jsx
// Display - Nombre grande
className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"

// Hero title
className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"

// Section title
className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight"

// Card title
className="text-xl md:text-2xl font-semibold"

// Body large
className="text-lg md:text-xl text-neutral-600"

// Body
className="text-base text-neutral-600"

// Caption
className="text-sm font-medium text-neutral-500"

// Label
className="text-xs font-medium uppercase tracking-wide text-neutral-400"
```

---

## Espaciado

### Sistema Base (8px)

```
4px   - 1    (xs)
8px   - 2    (sm)
12px  - 3
16px  - 4    (md)
24px  - 6    (lg)
32px  - 8    (xl)
48px  - 12   (2xl)
64px  - 16   (3xl)
96px  - 24   (4xl)
128px - 32   (5xl)
```

### Layout

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| **Contenedor max-width** | 100% | 100% | 1280px |
| **Contenedor padding** | 24px | 48px | 64px |
| **Sección vertical** | 64px | 96px | 128px |
| **Gap entre cards** | 16px | 24px | 32px |
| **Navbar height** | 64px | 72px | 80px |

---

## Componentes

### Navigation

```jsx
// Contenedor
className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-neutral-100 z-50"

// Links
className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"

// Link activo
className="text-sm font-medium text-neutral-900"

// CTA Button
className="text-sm font-medium px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
```

### Hero Section

**Estructura:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Label pequeño: "Software Developer"]                          │
│                                                                 │
│  Raúl                          ┌──────────────────────┐         │
│  Fernández                     │                      │         │
│                                │    BLOB GRADIENT     │         │
│  Párrafo descriptivo           │    (Elemento visual  │         │
│  corto y profesional.          │     abstracto)       │         │
│                                │                      │         │
│  [Ver Proyectos] [Contactar]   └──────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```jsx
// Label superior
className="text-sm font-medium text-neutral-500 mb-4"

// Nombre (Display)
className="text-5xl md:text-7xl lg:text-8xl font-bold text-neutral-900 tracking-tight leading-none"

// Descripción
className="text-lg md:text-xl text-neutral-600 max-w-md mt-6"

// Contenedor botones
className="flex gap-4 mt-8"
```

### Blob/Mesh Gradient

El elemento visual distintivo - una forma orgánica abstracta:

```css
.blob-gradient {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.blob-gradient::before {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  background:
    radial-gradient(ellipse at 30% 40%, #4A90D9 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, #F67300 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, #7BB3E0 0%, transparent 60%);
  filter: blur(60px);
  animation: blob-morph 20s ease-in-out infinite;
}

@keyframes blob-morph {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(5deg); }
}
```

**Alternativa con imagen estática:**
- Exportar blob como PNG/WebP con transparencia
- Usar `object-fit: cover` para responsividad

### Cards

```jsx
// Card base
className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 hover:border-neutral-200 transition-colors"

// Card con hover elevación
className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"

// Card título
className="text-xl font-semibold text-neutral-900 mb-2"

// Card descripción
className="text-neutral-600 mb-4"
```

### Buttons

**Primary (Dark):**
```jsx
className="inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
```

**Secondary (Outline):**
```jsx
className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors"
```

**Ghost:**
```jsx
className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
```

**Accent (Orange):**
```jsx
className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
```

### Tags/Badges

```jsx
// Tech tag
className="inline-flex px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full"

// Status badge (disponible)
className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full"

// Featured badge
className="inline-flex px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
```

### Section Headers

```jsx
// Contenedor
className="mb-12 md:mb-16"

// Label (opcional)
className="text-sm font-medium text-orange-500 mb-2"

// Título
className="text-3xl md:text-4xl font-semibold text-neutral-900 tracking-tight"

// Descripción (opcional)
className="text-lg text-neutral-600 mt-4 max-w-2xl"
```

---

## Secciones

### Hero
- Fondo: `#FAFAFA`
- Layout: Grid 2 columnas (texto + blob)
- Altura: 100vh o min-height 700px

### About/Skills
- Fondo: `#FFFFFF`
- Cards en grid 3 columnas
- Icons: Lucide, color `#525252`

### Projects
- Fondo: `#FAFAFA`
- Cards grandes con imagen
- Hover: elevación sutil

### Experience (Timeline)
- Fondo: `#FFFFFF`
- Layout: Lista vertical con línea conectora
- Fechas: `font-mono`, color muted

### Contact
- Fondo: `#0A0A0A` (inversión a oscuro)
- Texto: `#FFFFFF` y `#A3A3A3`
- CTA: botón orange accent

### Footer
- Fondo: `#0A0A0A`
- Links: `#737373` hover `#FFFFFF`
- Texto pequeño, minimalista

---

## Animaciones

### Principios

- **Propósito:** Solo para feedback y transiciones naturales
- **Duración:** 150ms - 300ms máximo
- **Easing:** `ease-out` para entradas, `ease-in-out` para loops

### Transiciones Permitidas

```css
/* Hover general */
transition: color 150ms ease-out,
            border-color 150ms ease-out,
            background-color 150ms ease-out;

/* Cards hover */
transition: transform 200ms ease-out,
            box-shadow 200ms ease-out,
            border-color 200ms ease-out;

/* Elevación sutil */
transform: translateY(-4px);
```

### Lo que NO usar

- ~~Animaciones de entrada al scroll~~
- ~~Parallax~~
- ~~Partículas flotantes~~
- ~~Scanline effects~~
- ~~Mouse tracking/spotlight~~
- ~~Glowing borders~~
- ~~Text gradients animados~~

---

## Responsive

### Breakpoints (Tailwind)

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Adaptaciones Clave

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Hero: Nombre | 48px | 80px |
| Hero: Layout | Stack vertical | 2 columnas |
| Cards grid | 1 columna | 2-3 columnas |
| Nav | Hamburger menu | Links inline |
| Sección padding | 64px vertical | 128px vertical |
| Blob | Debajo del texto | Al lado derecho |

---

## Migración desde Diseño Actual

### Cambios Principales

| Actual | Nuevo |
|--------|-------|
| Fondo `slate-950` (oscuro) | Fondo `#FAFAFA` (claro) |
| Cards glassmorphism | Cards sólidas con border sutil |
| Animación scanline | Eliminada |
| Partículas flotantes | Eliminadas |
| Mouse tracking | Eliminado |
| Texto con glow | Texto sólido |
| Orange `#F97316` | Orange `#F67300` |
| Inter + Roboto Mono | Inter Tight |

### Archivos a Modificar

1. `app/globals.css` - Variables CSS, remover animaciones
2. `app/layout.tsx` - Cambiar fuente a Inter Tight
3. `components/portfolio/portfolio-client.tsx` - Refactorizar completo
4. `tailwind.config.ts` - Actualizar colores custom

---

## Referencias

- **Weaverly** - Layout hero, tipografía bold, blob gradient
- **Linear** - Simplicidad, espaciado, profesionalismo
- **Vercel** - Contraste blanco/negro, claridad
- **Stripe** - Jerarquía tipográfica, CTAs

---

*Actualizado: Enero 2026*
