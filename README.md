[README.md](https://github.com/user-attachments/files/31965411/README.md)
# La Orejona

Sitio de una sola página sobre la historia de la UEFA Champions League: cronología, cifras, curiosidades, el palmarés completo de las 71 finales y un par de cosas para jugar.

**Ver en vivo:** https://mauriciomubravo.github.io

## Qué incluye

- Trofeo interactivo en 3D (arrastrable, con puntos que muestran datos sobre su historia y medidas)
- Reproductor del himno de la Champions
- Línea de tiempo de los balones oficiales de cada final
- Gráfico de los máximos goleadores históricos
- Leyendas del torneo, con foto y una línea de contexto
- Tabla de probables campeones de la edición actual (proyecciones de Opta)
- Palmarés completo: las 71 finales, buscador por club o año, escudos, y el detalle de títulos de cada club al hacer clic
- Quiz de 6 preguntas
- "Girador del destino": una ruleta que sortea al próximo campeón entre los favoritos

## Stack

- HTML, CSS y JavaScript puro — sin frameworks ni paso de build
- [three.js](https://threejs.org/) (vía CDN) solo para el visor 3D del trofeo
- Google Fonts: Oswald, Source Serif 4, JetBrains Mono

## Estructura

Todos los archivos viven en la raíz del repo, sin subcarpetas, para que GitHub Pages los sirva sin configuración adicional:

| Archivo | Contenido |
|---|---|
| `index.html` | el markup de la página |
| `styles.css` | todos los estilos |
| `script.js` | toda la lógica: trofeo 3D, reproductor, palmarés, quiz, ruleta, etc. |
| `*.png`, `*.jpg` | escudos de clubes, fotos de leyendas y goleadores, balones oficiales, el trofeo |
| `anthem.mp3` | el himno de la Champions |
| `favicon.ico`, `favicon-*.png`, `apple-touch-icon.png`, `site.webmanifest` | favicon del sitio |

## Correr en local

No requiere instalación ni dependencias. Alcanza con abrir `index.html` en el navegador, o servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

y entrar a `http://localhost:8000`.

## Datos

- Resultados de las 71 finales: histórico oficial de la competición hasta la edición 2025-26.
- Proyecciones de "probables campeones": [Opta Analyst](https://theanalyst.com/articles/champions-league-predictions-2026-27-opta-supercomputer), 4 de septiembre de 2026.

## Actualizar el sitio

Este repo se publica como GitHub Pages de usuario (`mauriciomubravo.github.io`), así que cualquier cambio en la rama principal se refleja automáticamente en el sitio en vivo, sin pasos extra.
