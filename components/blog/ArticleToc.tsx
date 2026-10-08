"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TocEntry } from "@/lib/blog/headings";

// Línea donde se considera que una sección "empezó" (debajo de la barra
// fija de móvil).
const ACTIVE_OFFSET = 120;

function useReadingState(contentId: string, ids: string[]) {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const [progress, setProgress] = useState(0);
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      const content = document.getElementById(contentId);
      if (content) {
        const rect = content.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : rect.top < 0 ? 1 : 0);
      }
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [contentId, key]);

  return { active, progress };
}

function goTo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.history.pushState(null, "", `#${id}`);
}

function TocList({ toc, active, onNavigate, size }: { toc: TocEntry[]; active?: string; onNavigate?: () => void; size: "sm" | "base" }) {
  return (
    <ol className="flex flex-col gap-0.5">
      {toc.map((entry) => {
        const current = entry.id === active;
        return (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={current ? "location" : undefined}
              onClick={(event) => {
                goTo(event, entry.id);
                onNavigate?.();
              }}
              className={`flex min-h-10 items-center rounded-lg px-3 py-2 font-sans leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate motion-reduce:transition-none ${
                size === "sm" ? "text-sm" : "text-base"
              } ${current ? "bg-brand-gray font-semibold text-brand-black" : "text-brand-slate hover:bg-brand-gray/70 hover:text-brand-black"}`}
            >
              {entry.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function ProgressBar({ progress, className = "" }: { progress: number; className?: string }) {
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-brand-slate/15 ${className}`} aria-hidden="true">
      <div className="h-full origin-left rounded-full bg-brand-orange" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

// Escritorio: índice fijo en la columna lateral, con la sección actual
// marcada (aria-current) y barra de progreso de lectura.
export function ArticleTocSidebar({ toc, contentId }: { toc: TocEntry[]; contentId: string }) {
  const { active, progress } = useReadingState(
    contentId,
    toc.map((entry) => entry.id)
  );
  const labelId = useId();
  return (
    <nav aria-labelledby={labelId}>
      <p id={labelId} className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-brand-slate">
        En este artículo
      </p>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar progress={progress} className="flex-1" />
        <span className="font-sans text-xs tabular-nums text-brand-slate">{Math.round(progress * 100)} %</span>
      </div>
      <div className="mt-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
        <TocList toc={toc} active={active} size="sm" />
      </div>
    </nav>
  );
}

// Móvil y tableta: barra fija arriba (el header del sitio no es fijo) que
// muestra la sección actual y se despliega con el índice completo.
export function ArticleTocBar({ toc, contentId }: { toc: TocEntry[]; contentId: string }) {
  const { active, progress } = useReadingState(
    contentId,
    toc.map((entry) => entry.id)
  );
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const current = toc.find((entry) => entry.id === active);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav aria-label="En este artículo" className="sticky top-0 z-30 -mx-4 border-b border-brand-slate/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:-mx-6 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-slate sm:px-6"
      >
        <span className="shrink-0 font-sans text-xs font-bold uppercase tracking-[0.12em] text-brand-slate">En este artículo</span>
        <span className="min-w-0 flex-1 truncate font-sans text-sm text-brand-black">{current?.text}</span>
        <ChevronDown className={`size-5 shrink-0 text-brand-slate transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <ProgressBar progress={progress} className="rounded-none" />
      <div id={panelId} hidden={!open} className="max-h-[60vh] overflow-y-auto border-t border-brand-slate/10 bg-white px-2 py-2 sm:px-4">
        <TocList toc={toc} active={active} size="base" onNavigate={() => setOpen(false)} />
      </div>
    </nav>
  );
}
