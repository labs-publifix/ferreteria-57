---
name: blog-articulo
description: "Flujo editorial del blog de Ferretería 57. Úsala cuando pregunten «¿cuál es el siguiente artículo?», «siguiente tema del blog» o digan «redáctalo»: responde con el siguiente tema del backlog (blog:next) o redacta de punta a punta el artículo, su guía PDF de Club 57, los enlaces de ida y vuelta, las validaciones y el PR con preview."
---

# Blog de Ferretería 57: siguiente artículo y «redáctalo»

Fuente de verdad: `docs/blog/backlog_blog_ferreteria57.xlsx` (hojas Backlog, Briefs SEO, Guías PDF, Mapa de enlaces y Claude Code). Ya está en el repo: no lo pidas. Flujo completo y comandos: `docs/blog/FLUJO.md`.

## «¿Cuál es el siguiente artículo?» / «siguiente tema del blog»

1. Corre `npm run blog:next` (con `-- --list 5` si piden varios).
2. Responde breve, sin pegar toda la salida:
   - tema (ID, H1) y fecha de publicación;
   - resumen del brief: keyword, tipo y rango de palabras, H2 principales, guía PDF (título y páginas);
   - enlaces pendientes: los de ida y vuelta que habrá que agregar en artículos existentes;
   - si `blog:next` advierte diferencias entre el Excel y el CSV (fecha o slug), dilo primero: hay que corregir antes de redactar.
3. No redactes nada hasta que digan «redáctalo».

## «Redáctalo»

No pidas aprobación del borrador en el chat: la revisión se hace en el preview del PR. Haz todo en una rama nueva desde `main`.

a. `npm run blog:next`: tema, brief completo, ficha de la guía y enlaces (`blog:links` del tema).

b. `npm run blog:new -- Bxx`: crea `content/blog/articles/{slug}.ts` y `content/blog/guides/{slug}.ts` con marcadores `TODO`.

c. **Artículo** completo según el brief (hoja Briefs SEO) y las reglas de abajo: `seoTitle`, `metaDescription`, keywords secundarias, intro con respuesta directa, H2 del brief, tabla/callout/`cta` si es Pilar o Fondo, FAQ del brief, `relatedTopicIds`. Quita todos los `TODO`.

d. **Guía** según la hoja «Guías PDF» (título, páginas, contenido por página). La portada la pone el PDF: en el archivo van de 1 a 3 páginas de contenido. Bloques: `tabla`, `checklist`, `pasos`, `consejo`, `callout` (`mitad: true` en dos recuadros seguidos los pone lado a lado). `titulo` igual a `guia.titulo` del artículo.

e. **PDF**: `npm run blog:pdf -- Bxx` (reporta tiempo y si algo no cupo). Renderiza las páginas a imágenes (`pdftoppm -r 110 -png .blog-pdf/guia-{slug}.pdf <carpeta>/guia`), revísalas (cortes, contraste, desbordes; corrige y repite) y **muéstralas en el chat**. Si el entorno lo permite, envía también el PDF como archivo. No esperes aprobación.

f. **Enlaces de ida y vuelta**: sigue `npm run blog:links -- Bxx`. Agrega en el artículo nuevo los de (a) y, en cada artículo anterior de (b), el `[[Bxx|ancla]]` con el ancla sugerida, en un párrafo donde tenga sentido. A cada artículo anterior que toques súbele `updatedAt` a una fecha igual o posterior al `publishAt` del nuevo.

g. `npm run blog:verify`: blog:check, blog:links, TypeScript, lint, pruebas y build. Todo en verde antes de seguir.

h. **PR** contra `main` (no lo mergees). Incluye:
   - checklist de verificación (salida de `blog:verify`, keyword en title/intro/h2, FAQ ≥ 3, palabras dentro del rango, enlaces agregados, guía revisada);
   - URL del preview del artículo: `{preview}/blog/{slug}` (un artículo programado solo se ve si el entorno Preview tiene `BLOG_SHOW_SCHEDULED=1`);
   - enlace de vista previa del PDF: `{preview}/admin/blog/guias/{slug}/vista-previa` (con sesión de admin);
   - las imágenes del PDF que mostraste.

i. Cierra con una sola línea: «Cuando esté publicado, solicita indexación de esta URL en Search Console».

## Reglas de redacción (artículo y guía)

- Sin fotos. Autor: «Equipo Ferretería 57».
- Sin números de norma, estadísticas, fechas ni precios. Las cifras específicas (diámetros, calibres, velocidades, temperaturas) se remiten a la etiqueta, el empaque, la ficha o el manual. Si hace falta un ejemplo numérico, es ilustrativo y se dice.
- Respeta la «Regla de redacción» de la fila del Excel: no se investiga ni se citan datos no respaldados.
- Marcas y productos solo como aparecen en el catálogo del sitio; nunca inventes líneas, modelos ni garantías.
- Enlaces solo a categorías reales (`content/blog/catalog-links.ts`, con `catalogHref`), a búsquedas `/buscar?q=…` y a artículos que existen (`[[Bxx|ancla]]`). Nunca a productos sueltos.
- Tono útil y honesto, sin promoción exagerada. No cites cifras de puntos de Club 57.
- Keyword del backlog en el title (o seoTitle), en la intro y en al menos un h2. FAQ de 3 preguntas o más.
- Rango de palabras por tipo: Pilar 2000–2500, Fondo 1500–2000, Corto 900–1300, Fin de semana 1200–1600.
- Nunca dejes `TODO`, `[VERIFICAR]`, lorem ni texto prohibido (lista en `lib/blog/quality.ts`).
- Nunca menciones proveedores técnicos (servicios de correo, hosting, bases de datos, nombres de herramientas internas).

## Lo que esta skill no hace

- No cambia fechas del calendario (salvo `updatedAt` de artículos que reciben un enlace).
- No toca puntos, canjes ni checkout de Club 57.
- No envía correos ni crea tareas programadas.
