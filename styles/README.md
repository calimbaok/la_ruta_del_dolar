# 📂 Estructura de Estilos CSS

Este proyecto utiliza un sistema modular de CSS donde cada componente tiene su propio archivo.

## 📋 Archivos de Componentes

| Archivo | Descripción |
|---------|-------------|
| `variables.css` | Paleta de colores y variables globales |
| `reset.css` | Reset de estilos y tipografía base |
| `layout.css` | Grid container, secciones y layout general |
| `nav.css` | Barra de navegación sticky |
| `hero.css` | Sección hero con video de fondo |
| `buttons.css` | Botones (primarios, secundarios, tamaños) |
| `progress.css` | Barra de progreso y cards de perks |
| `map.css` | Componentes del mapa Mapbox |
| `panel.css` | Panel de donación |
| `game.css` | Estilos del juego Ruta Infinita |
| `footer.css` | Footer |
| `donar-page.css` | Estilos específicos de `donar.html` |

## 🔗 Importación

El archivo **`styles.css`** centraliza todos los imports en el orden correcto:

```css
@import url('./variables.css');
@import url('./reset.css');
@import url('./layout.css');
/* ... resto de componentes */
```

## ✨ Ventajas de esta estructura

✅ **Modularidad**: Cada componente es independiente  
✅ **Mantenibilidad**: Fácil encontrar y actualizar estilos  
✅ **Escalabilidad**: Agregar nuevos componentes es simple  
✅ **Orden claro**: Variables → Reset → Componentes  

## 🎯 Cómo agregar un nuevo componente

1. Crear archivo `nombre-componente.css` (sin guion bajo al inicio)
2. Agregar los estilos dentro
3. Importarlo en `styles.css` en la posición correcta

Ejemplo:
```css
/* styles.css */
@import url('./carousel.css');  /* ← agregar línea nueva */
```

## 📱 HTML

En `index.html` y `donar.html` solo necesitas linkear:

```html
<link rel="stylesheet" href="styles/styles.css" />
```

Todos los componentes se cargarán automáticamente.
