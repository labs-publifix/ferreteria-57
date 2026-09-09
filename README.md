# ferreteria-57
E-Commerce de Ferretería 57

## Desarrollo

Next.js 14 (App Router) + TypeScript + Tailwind CSS, desplegado en Vercel.

```bash
npm install
npm run dev
```

- `/dev/ui` — kit de componentes atómicos (`Button`, `Badge`, `PriceTag`, `RatingStars`) para verificar variantes antes de construir pantallas reales.
- `components/ui/` — componentes atómicos tipados en TypeScript.
- `tailwind.config.ts` — tokens de marca (`brand.orange`, `brand.slate`, `brand.black`, `brand.white`, `brand.gray`) y tipografías (`font-display` = Russo One, `font-sans` = Inter).

`prelaunch-site/` es un sitio estático aparte (la página pública "Próximamente", desplegada a GitHub Pages) — no forma parte de la app de Next.js.

El repo está conectado a Vercel (Framework Preset: Next.js, sin overrides) — cada push genera su propio deployment de preview para revisar `/dev/ui` en vivo antes de fusionar a `main`.
