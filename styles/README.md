# 📂 Estructura de Estilos CSS

Este proyecto utiliza un sistema modular de CSS donde cada componente tiene su propio archivo.

## 📋 Archivos de Componentes

| Archivo | Descripción |
|---------|-------------|
| `_variables.css` | Paleta de colores y variables globales |
| `_reset.css` | Reset de estilos y tipografía base |
| `_layout.css` | Grid container, secciones y layout general |
| `_nav.css` | Barra de navegación sticky |
| `_hero.css` | Sección hero con video de fondo |
| `_buttons.css` | Botones (primarios, secundarios, tamaños) |
| `_progress.css` | Barra de progreso y cards de perks |
| `_map.css` | Componentes del mapa Mapbox |
| `_panel.css` | Panel de donación |
| `_game.css` | Estilos del juego Ruta Infinita |
| `_footer.css` | Footer |
| `_donar-page.css` | Estilos específicos de `donar.html` |

## 🔗 Importación

El archivo **`styles.css`** centraliza todos los imports en el orden correcto:

```css
@import "_variables.css";
@import "_reset.css";
@import "_layout.css";
/* ... resto de componentes */
```

## ✨ Ventajas de esta estructura

✅ **Modularidad**: Cada componente es independiente  
✅ **Mantenibilidad**: Fácil encontrar y actualizar estilos  
✅ **Escalabilidad**: Agregar nuevos componentes es simple  
✅ **Orden claro**: Variables → Reset → Componentes  

## 🎯 Cómo agregar un nuevo componente

1. Crear archivo `_nombre-componente.css`
2. Agregar los estilos dentro
3. Importarlo en `styles.css` en la posición correcta

Ejemplo:
```css
/* styles.css */
@import "_carousel.css";  /* ← agregar línea nueva */
```

## 📱 HTML

En `index.html` y `donar.html` solo necesitas linkear:

```html
<link rel="stylesheet" href="styles/styles.css" />
```

Todos los componentes se cargarán automáticamente.
