# ferreteria-57
E-Commerce de Ferretería 57

## Desarrollo

Next.js 14 (App Router) + TypeScript + Tailwind CSS, desplegado en Vercel.

```bash
npm install
npm run dev
```

```bash
npm test        # pruebas unitarias (vitest)
npm run lint
```

## Blog (`/blog`)

Sin MDX ni base de datos: cada artículo es un archivo TypeScript en `content/blog/articles/{slug}.ts` que exporta `defineArticle({...})` y se valida con Zod (`lib/blog/article-schema.ts`).

- **Índice generado.** `scripts/blog-build-index.ts` escribe `content/blog/_index.ts` (un import estático por artículo) y valida todo el contenido. Lo regeneran `predev` y `blog:check` (que corre en `prebuild`), así que `npm run dev` y `npm run build` siempre lo actualizan; a mano: `npm run blog:index`. El archivo generado se commitea.
- **Validación en build.** Un campo inválido, un slug repetido o reservado (`categoria`, `pagina`, `rss.xml`), un `seoTitle` de más de 60 caracteres, una meta fuera de 120–155 o un enlace `[[B04|ancla]]` a un artículo que no existe o que se publica después rompen el build con el archivo y el campo exactos.
- **Sintaxis en línea** (parser propio, `lib/blog/inline.ts`): `**negrita**`, `[texto](/ruta)` (solo rutas internas) y `[[B04|ancla]]`. Todo el texto se escapa; nunca se inyecta HTML.
- **Bloques:** `h2`, `h3`, `p`, `ul`, `ol`, `table`, `callout` (consejo, seguridad, nota), `steps` y `cta` (la guía de Club 57).
- **Publicación.** Un artículo es público cuando su `publishAt` (ISO con `-06:00`) ya pasó. Antes de eso da 404 y no aparece en listados, home, sitemap, RSS ni JSON-LD. Para revisarlo en un preview, define `BLOG_SHOW_SCHEDULED=1` (se ignora en producción).
- **Categorías:** `content/blog/clusters.ts` (slug, nombre, descripción y color).
- `/admin/blog` toma el estado (programado o publicado) del registro real (`lib/blog/registry.ts`).
- **Calidad y flujo** (detalle en `docs/blog/FLUJO.md`): `npm run blog:new -- B09` crea el artículo desde el backlog, `npm run blog:check` valida (corre en `prebuild` y en CI) y `npm run blog:links -- B09` / `-- --all` revisa el enlazado interno contra `docs/blog/mapa-enlaces.csv`.
- **Probar fechas:** `BLOG_NOW_OVERRIDE=<fecha ISO>` cambia el «ahora» del blog solo fuera de producción real (`lib/blog/now.ts`).

- `/dev/ui` — kit de componentes atómicos (`Button`, `Badge`, `PriceTag`, `RatingStars`) para verificar variantes antes de construir pantallas reales.
- `components/ui/` — componentes atómicos tipados en TypeScript.
- `tailwind.config.ts` — tokens de marca (`brand.orange`, `brand.slate`, `brand.black`, `brand.white`, `brand.gray`) y tipografías (`font-display` = Russo One, `font-sans` = Inter).

`prelaunch-site/` es un sitio estático aparte (la página pública "Próximamente", desplegada a GitHub Pages) — no forma parte de la app de Next.js.

El repo está conectado a Vercel (Framework Preset: Next.js, sin overrides) — cada push genera su propio deployment de preview para revisar `/dev/ui` en vivo antes de fusionar a `main`.
