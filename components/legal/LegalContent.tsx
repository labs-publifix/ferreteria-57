import Link from "next/link";

// Piezas compartidas por las 3 páginas legales (Aviso de Privacidad,
// Términos y Condiciones, Política de Envíos) — mismo criterio que el
// resto del sitio: encabezados en Russo One solo hasta H2 (H3 en sans,
// semibold, para no saturar de mayúsculas un texto ya denso de leer). El
// contenido nunca se resume ni se reescribe: estos componentes solo le dan
// forma tipográfica al texto aprobado por el cliente, tal cual.
export function LegalPageHeader({
  title,
  subtitle,
  lastUpdated,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-2xl font-sans text-sm text-brand-black sm:text-base">{subtitle}</p>
      <p className="mt-3 font-sans text-xs text-brand-slate/60">Última actualización: {lastUpdated}</p>
    </header>
  );
}

export function LegalArticle({ children }: { children: React.ReactNode }) {
  return <article className="mx-auto mt-10 max-w-3xl text-left sm:mt-12">{children}</article>;
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-lg uppercase text-brand-slate first:mt-0 sm:text-xl">
      {children}
    </h2>
  );
}

export function LegalH3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 font-sans text-base font-bold text-brand-black">{children}</h3>;
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 font-sans text-sm leading-relaxed text-brand-black sm:text-base">{children}</p>;
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 font-sans text-sm leading-relaxed text-brand-black sm:text-base">
      {children}
    </ul>
  );
}

// Link externo (a otro sitio, p. ej. INAI/PROFECO/el propio dominio) —
// mismo estilo de subrayado que ya usan los enlaces internos del sitio.
export function LegalExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-brand-slate underline underline-offset-2 hover:text-brand-black">
      {children}
    </a>
  );
}

// Link interno (a otra página del sitio) — usa next/link para navegación
// client-side, mismo estilo visual que LegalExternalLink.
export function LegalInternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-slate underline underline-offset-2 hover:text-brand-black">
      {children}
    </Link>
  );
}
