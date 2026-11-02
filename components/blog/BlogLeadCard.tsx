import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogCardData } from "@/lib/blog/card";
import { CLUSTER_THEME } from "@/lib/blog/theme";
import { ArticleBadges } from "./ArticleBadges";
import { AuthorLine } from "./AuthorLine";

// Artículo destacado de /blog (el más reciente): la misma tarjeta del
// blog, pero horizontal en escritorio, con el título más grande y el
// resumen. Un solo enlace con foco visible, como BlogCard.
export function BlogLeadCard({ card }: { card: BlogCardData }) {
  const theme = CLUSTER_THEME[card.tema];
  return (
    <Link
      href={`/blog/${card.slug}`}
      className="group grid overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(26,26,26,0.06),0_12px_32px_-16px_rgba(26,26,26,0.22)] ring-1 ring-brand-slate/10 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(26,26,26,0.06),0_22px_44px_-18px_rgba(26,26,26,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gray motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:grid-cols-[2fr_3fr]"
    >
      <div className={`flex min-h-[9rem] flex-col justify-between gap-8 p-6 sm:p-8 lg:min-h-[18rem] ${theme.block}`}>
        <ArticleBadges tema={card.tema} readingMinutes={card.readingMinutes} />
        <p className="max-w-[16ch] font-display text-xl uppercase leading-tight [text-wrap:balance] sm:text-2xl">{card.clusterNombre}</p>
      </div>
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <h3 className="font-display text-2xl leading-tight text-brand-black [text-wrap:balance] sm:text-3xl">{card.title}</h3>
        <p className="mt-4 line-clamp-3 max-w-[60ch] font-sans text-base leading-relaxed text-brand-black/75">{card.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-8">
          <AuthorLine>
            <time dateTime={card.publishAt}>{card.fechaLarga}</time> · {card.readingMinutes} min
          </AuthorLine>
          <span className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-black underline-offset-4 group-hover:underline">
            Leer el artículo
            <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
