import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toCardData } from "@/lib/blog/card";
import { getVisibleArticles } from "@/lib/blog/content";
import { BlogCardGrid } from "./BlogCard";

// Sección "Blog" del home: los 3 artículos más recientes. Con menos de 3
// visibles no se pinta (una fila incompleta en el home se ve a medias).
export function BlogHomeSection() {
  const latest = getVisibleArticles().slice(0, 3);
  if (latest.length < 3) return null;
  return (
    <section className="mt-14 sm:mt-20" aria-labelledby="blog-heading">
      <div className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-brand-slate">Blog</p>
          <h2 id="blog-heading" className="mt-1.5 font-display text-lg uppercase text-brand-slate [text-wrap:balance] sm:text-xl">
            Guías y consejos de ferretería para tu casa y tu negocio
          </h2>
          <p className="mt-2 font-sans text-sm text-brand-black/70 sm:text-base">
            Escritos por el equipo de Ferretería 57 en Querétaro. Léelos aquí y descarga las guías en PDF con Club 57.
          </p>
        </div>
        <Link
          href="/blog"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-brand-slate px-5 font-sans text-sm font-semibold text-white transition-colors hover:bg-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gray sm:self-auto"
        >
          Ver todo el blog
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <BlogCardGrid cards={latest.map(toCardData)} />
    </section>
  );
}
