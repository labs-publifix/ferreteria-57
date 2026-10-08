"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Download, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { pushBlogEvent } from "@/lib/blog/analytics";
import { GUIAS_ENABLED, guiaDownloadHref, loginHref, registroHref } from "@/lib/blog/guias";

export type GuiaCtaVariant = "sidebar" | "inline" | "final";

// CTA de la guía PDF del artículo. El servidor siempre pinta la versión de
// visitante (registro en Club 57); al hidratar, si hay sesión, cambia a la
// versión de miembro ("Tu guía está lista"). Las dos versiones viven
// apiladas en la misma celda de un grid y solo se alterna cuál es visible:
// la caja mide lo que la más alta, así que el cambio no mueve la página
// (visibility:hidden además saca la versión oculta del teclado y de los
// lectores de pantalla).
export function GuiaClubCta({
  slug,
  guiaTitulo,
  variant,
  anchorId,
}: {
  slug: string;
  guiaTitulo: string;
  variant: GuiaCtaVariant;
  anchorId?: string;
}) {
  const { user, isLoading } = useAuth();
  const member = !isLoading && user !== null;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          pushBlogEvent("blog_cta_view", { slug, variant });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slug, variant]);

  const click = (action: string) => () => pushBlogEvent("blog_cta_click", { slug, variant, action });
  const dark = variant === "final";
  const compact = variant === "sidebar";

  const shell = {
    sidebar: "rounded-2xl bg-white p-5 ring-1 ring-brand-slate/15",
    inline: "my-10 rounded-2xl bg-brand-gray p-6 sm:p-7",
    final: "rounded-3xl bg-brand-slate p-6 text-white sm:p-10",
  }[variant];

  const title = compact
    ? "font-display text-base leading-snug"
    : dark
      ? "font-display text-2xl leading-tight sm:text-3xl"
      : "font-display text-xl leading-snug sm:text-2xl";

  const body = `font-sans ${compact ? "text-sm" : "text-base"} ${dark ? "text-white/85" : "text-brand-black/80"}`;
  const primary =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-orange px-5 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    (dark ? "focus-visible:ring-white focus-visible:ring-offset-brand-slate" : "focus-visible:ring-brand-black");
  const secondary = `inline-flex min-h-11 items-center font-sans text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 rounded ${
    dark ? "text-white hover:text-white/80 focus-visible:ring-white" : "text-brand-black hover:text-brand-slate focus-visible:ring-brand-slate"
  }`;

  const Heading = variant === "final" ? "h2" : "p";

  return (
    <aside
      ref={ref}
      id={anchorId}
      aria-label="Guía en PDF del artículo"
      className={`${shell} scroll-mt-24`}
      data-cta-variant={variant}
    >
      <div className={`grid ${compact ? "" : "sm:grid-cols-[auto_1fr] sm:gap-6"}`}>
        {!compact && (
          <span
            aria-hidden="true"
            className={`mb-4 hidden size-14 items-center justify-center rounded-2xl sm:mb-0 sm:flex ${
              dark ? "bg-brand-orange text-brand-black" : "bg-white text-brand-slate ring-1 ring-brand-slate/15"
            }`}
          >
            <FileText className="size-7" strokeWidth={1.75} />
          </span>
        )}
        <div className="grid min-w-0 [grid-template-areas:'stack']">
          {/* Visitante */}
          <div className={`[grid-area:stack] ${member ? "invisible" : ""}`}>
            <Heading className={title}>Descarga gratis la guía «{guiaTitulo}»</Heading>
            <p className={`mt-2 ${body}`}>
              Regístrate gratis en Club 57 para descargar las guías del blog en PDF, recibir promociones para miembros y
              acumular puntos en tus compras.
            </p>
            <div className={`mt-4 flex ${compact ? "flex-col items-stretch gap-1" : "flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5"}`}>
              <Link href={registroHref(slug)} onClick={click("registro")} className={primary}>
                Registrarme en Club 57
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href={loginHref(slug)} onClick={click("login")} className={`${secondary} ${compact ? "justify-center" : ""}`}>
                Ya soy miembro: iniciar sesión
              </Link>
            </div>
          </div>

          {/* Miembro */}
          <div className={`[grid-area:stack] ${member ? "" : "invisible"}`}>
            <Heading className={title}>Tu guía está lista</Heading>
            <p className={`mt-2 ${body}`}>
              Como miembro de Club 57 puedes descargar «{guiaTitulo}» en PDF{GUIAS_ENABLED ? "." : " en cuanto esté disponible."}
            </p>
            <div className="mt-4">
              {GUIAS_ENABLED ? (
                <a href={guiaDownloadHref(slug)} onClick={click("descarga")} className={primary}>
                  <Download className="size-4" aria-hidden="true" />
                  Descargar la guía
                </a>
              ) : (
                <button type="button" disabled className={`${primary} cursor-not-allowed opacity-60 hover:bg-brand-orange`}>
                  <Download className="size-4" aria-hidden="true" />
                  Disponible muy pronto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
