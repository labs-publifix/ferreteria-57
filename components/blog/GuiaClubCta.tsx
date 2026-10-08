"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Download, FileText, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { pushBlogEvent } from "@/lib/blog/analytics";
import { loginHref, MIS_GUIAS_HREF, registroHref } from "@/lib/blog/guias";
import { useClub57Membership } from "./useClub57Membership";
import { useGuideDownload } from "./useGuideDownload";

export type GuiaCtaVariant = "sidebar" | "inline" | "final";

// CTA de la guía PDF del artículo, en tres estados:
//   visitante     → «Registrarme en Club 57» e «Iniciar sesión», mismo peso,
//                   los dos con ?next=/blog/{slug}#guia (de regreso aquí,
//                   sin descargar solo).
//   miembro       → «Descargar guía (PDF)» + «Ver todas mis guías».
//   sin membresía → a /cuenta para completar el registro.
// El servidor pinta la versión de visitante; al hidratar se sabe si hay
// sesión y membresía. Las tres versiones viven apiladas en la misma celda
// de un grid y solo cambia cuál es visible: la caja mide lo que la más
// alta, así que el cambio no mueve la página (visibility:hidden además saca
// las ocultas del teclado y de los lectores de pantalla).
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
  const membership = useClub57Membership();
  const shown = membership === "loading" ? "visitante" : membership;
  const { download, downloading } = useGuideDownload();
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

  const click = (action: string) => pushBlogEvent("blog_cta_click", { slug, variant, action });
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
  const ring = dark ? "focus-visible:ring-white focus-visible:ring-offset-brand-slate" : "focus-visible:ring-brand-black";
  // Botón de acción: el mismo para registro e inicio de sesión (mismo peso
  // visual, como pide el flujo de Club 57) y para la descarga.
  const action = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-orange px-5 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${ring}`;
  const link = `inline-flex min-h-11 items-center gap-1.5 rounded font-sans text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 ${
    dark ? "text-white hover:text-white/80 focus-visible:ring-white" : "text-brand-black hover:text-brand-slate focus-visible:ring-brand-slate"
  }`;
  // Dos columnas iguales del ancho del botón más largo (grid a w-fit: las
  // columnas 1fr toman el max-content mayor), sin partir el texto.
  const pair = compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-2 sm:w-fit sm:grid-cols-2 sm:gap-3 sm:[&>a]:whitespace-nowrap";

  const Heading = variant === "final" ? "h2" : "p";
  const layer = (state: typeof shown) => `[grid-area:stack] ${shown === state ? "" : "invisible"}`;
  const isDownloading = downloading === slug;

  return (
    <aside
      ref={ref}
      id={anchorId}
      aria-label="Guía en PDF del artículo"
      className={`${shell} scroll-mt-24`}
      data-cta-variant={variant}
      data-cta-state={shown}
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
          <div className={layer("visitante")}>
            <Heading className={title}>Descarga gratis la guía «{guiaTitulo}»</Heading>
            <p className={`mt-2 ${body}`}>
              La guía es gratuita para miembros de Club 57. Regístrate o inicia sesión y descárgala en PDF.
            </p>
            <div className={`mt-4 ${pair}`}>
              <Link
                href={registroHref(slug)}
                onClick={() => {
                  click("registro");
                  pushBlogEvent("blog_guia_click_registro", { slug });
                }}
                className={action}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Registrarme en Club 57
              </Link>
              <Link
                href={loginHref(slug)}
                onClick={() => {
                  click("login");
                  pushBlogEvent("blog_guia_click_login", { slug });
                }}
                className={action}
              >
                <LogIn className="size-4" aria-hidden="true" />
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Miembro */}
          <div className={layer("miembro")}>
            <Heading className={title}>Tu guía está lista</Heading>
            <p className={`mt-2 ${body}`}>
              Como miembro de Club 57, descarga «{guiaTitulo}» en PDF. También la tienes en tu cuenta.
            </p>
            <div className={`mt-4 flex ${compact ? "flex-col items-stretch gap-1" : "flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5"}`}>
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => {
                  click("descarga");
                  download(slug);
                }}
                className={action}
              >
                {isDownloading ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                {isDownloading ? "Preparando tu guía…" : "Descargar guía (PDF)"}
              </button>
              <Link href={MIS_GUIAS_HREF} onClick={() => click("mis-guias")} className={`${link} ${compact ? "justify-center" : ""}`}>
                Ver todas mis guías
              </Link>
            </div>
          </div>

          {/* Con sesión, sin membresía */}
          <div className={layer("sin-membresia")}>
            <Heading className={title}>Completa tu registro en Club 57</Heading>
            <p className={`mt-2 ${body}`}>
              Tu cuenta todavía no está en Club 57. Completa tu registro en tu cuenta y descarga «{guiaTitulo}» gratis.
            </p>
            <div className="mt-4">
              <Link href="/cuenta" onClick={() => click("completar-registro")} className={`${action} ${compact ? "w-full" : ""}`}>
                Ir a mi cuenta
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
