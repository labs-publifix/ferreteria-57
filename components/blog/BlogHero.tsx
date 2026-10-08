import { BlogBreadcrumbs, type Crumb } from "./BlogBreadcrumbs";

// Encabezado de las páginas de listado del blog: ruta, etiqueta BLOG, H1 y
// subtítulo.
export function BlogHeroIntro({
  crumbs,
  eyebrow = "Blog",
  title,
  subtitle,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <BlogBreadcrumbs items={crumbs} tone="muted" />
      <p className="mt-8 font-sans text-xs font-bold uppercase tracking-[0.18em] text-brand-slate">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[2rem] uppercase leading-[1.05] text-brand-black [text-wrap:balance] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-[60ch] font-sans text-base leading-relaxed text-brand-black/75 sm:text-lg">{subtitle}</p>
    </>
  );
}

export function BlogHero(props: Parameters<typeof BlogHeroIntro>[0]) {
  return (
    <div className="border-b border-brand-slate/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <BlogHeroIntro {...props} />
      </div>
    </div>
  );
}
