# Flujo por artículo del blog

Del tema del backlog al artículo publicado. Sin cron, sin correos ni tablas: un artículo es público en cuanto llega su `publishAt`, porque las páginas del blog se generan en cada visita.

## 1. Crear el archivo: `npm run blog:new -- B09`

- Toma el tema de `supabase/seed/blog-backlog.csv` y crea `content/blog/articles/{slug}.ts`. Llena:
  - `topicId`, `slug`, `title` (H1), `cluster`, `pillar`, `keyword` y `guia.titulo`;
  - `publishAt` = `fecha_programada` a las 08:00 (-06:00);
  - `relatedTopicIds` sugeridos por el mapa de enlaces.
- No escribe contenido: deja marcas `TODO` y comentarios con los bloques disponibles.
- Falla si el tema no está en el backlog o si ya tiene artículo.
- Mientras quede un `TODO`, `blog:check` marca error y el build no pasa. El borrador no se puede publicar por accidente, pero `npm run dev` sigue funcionando para revisarlo.

## 2. Redactar según el Excel

Fuente: `docs/blog/backlog_blog_ferreteria57.xlsx`, hoja **Briefs SEO**. De ahí salen:

- `seoTitle` (máx. 60 caracteres) y `metaDescription` (120–155).
- Las keywords secundarias.
- La estructura de H2 y los puntos clave.
- La FAQ (3 preguntas o más).
- La «Regla de redacción»: sin cifras técnicas, normas ni precios; remitir al empaque o al manual.

Para escribir:

- **Bloques:** `h2`, `h3`, `p`, `ul`, `ol`, `table`, `callout`, `steps` y `cta` (la guía de Club 57, después del 2.º o 3.º h2).
- **Formato en línea:** `**negrita**`, `[texto](/ruta)` y `[[B04|ancla]]`.
- **Catálogo:** solo las categorías de `content/blog/catalog-links.ts`, con `catalogHref("herramienta")`. Lo que no tenga categoría propia va a `/buscar?q=…`. Nunca enlaces a productos sueltos.
- **Revisión en el preview:** el artículo programado se ve si el entorno tiene `BLOG_SHOW_SCHEDULED=1`; nunca aplica en producción.

## 3. Validar: `npm run blog:check`

Corre también en `prebuild` (todo build de Vercel) y en CI (`.github/workflows/blog-check.yml`). Imprime un reporte por artículo.

- **Errores** (frenan el build):
  - Esquema inválido.
  - Tema o slug que no coincide con el backlog.
  - `seoTitle` o meta fuera de rango.
  - Menos de 4 h2 o menos de 3 preguntas en la FAQ.
  - La keyword falta en el título, la intro o algún h2.
  - `[[Bxx]]` inválidos.
  - Categorías que no existen.
  - Texto prohibido: `[VERIFICAR]`, `TODO`, lorem, normas NOM/NMX, IPESA, Resend o precios con `$`.
  - La lista de texto prohibido se configura en `lib/blog/quality.ts`.
- **Advertencias:**
  - `publishAt` distinto de la fecha del backlog.
  - Palabras fuera del rango de su tipo (±15 %).
  - Pilar o Fondo sin tabla, callout o CTA.
  - Más de 12 enlaces internos.
  - Menos de 2 relacionados publicados.
  - Enlaces de ida y vuelta pendientes.

## 4. Enlazar: `npm run blog:links -- B09`

Cruza `docs/blog/mapa-enlaces.csv` con los `[[Bxx]]` reales y muestra el ancla sugerida de cada enlace. Solo lee; no modifica archivos.

- **(a)** Los enlaces que el artículo debe llevar hacia artículos ya publicados o que salen antes.
- **(b)** Los enlaces de ida y vuelta: artículos anteriores que deben apuntar a este. Al agregarlos, sube el `updatedAt` del artículo anterior a una fecha igual o posterior al `publishAt` del nuevo; así el enlace pasa la validación cronológica.
- **(c)** Los pendientes futuros.

`npm run blog:links -- --all` da el resumen global y el % de cumplimiento.

Un `[[Bxx]]` hacia un artículo que todavía no sale se muestra como texto, nunca como enlace a un 404.

## 5. Guía PDF (Fase 4)

Pendiente: generación y descarga de la guía del artículo para miembros de Club 57.

## 6. PR y preview

1. Rama y PR con el artículo. CI corre `blog:check` y las pruebas.
2. Revisa el preview de Vercel con `BLOG_SHOW_SCHEDULED=1` en el entorno Preview. Ahí el artículo programado aparece con el aviso «Vista previa» y `noindex`.
3. Al mergear, el artículo queda programado: aparece solo en `/blog`, el home, el sitemap y el RSS al llegar su `publishAt`, sin redeploy.

### Probar una fecha sin esperar (solo local)

```bash
npm run build
BLOG_NOW_OVERRIDE=2026-10-13T08:01:00-06:00 npm start
```

`BLOG_NOW_OVERRIDE` hace de «ahora» fuera de producción real (`lib/blog/now.ts`). En producción se ignora siempre y no se configura en Vercel.
