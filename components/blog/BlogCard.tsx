import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogCardData } from "@/lib/blog/card";
import { CLUSTER_THEME } from "@/lib/blog/theme";
import { ArticleBadges } from "./ArticleBadges";
import { AuthorLine } from "./AuthorLine";

// Tarjeta del blog: bloque de color del clúster arriba (badges y categoría)
// y cuerpo blanco con título, autor y fecha. Toda la tarjeta es UN solo
// enlace, con foco visible. Sin el número del tema: para el lector parecía
// un ranking y en el listado salía «desordenado» (02, 01, 03).
export function BlogCard({ card, headingLevel = "h3" }: { card: BlogCardData; headingLevel?: "h2" | "h3" }) {
  const theme = CLUSTER_THEME[card.tema];
  const Heading = headingLevel;
  return (
    <Link
      href={`/blog/${card.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(26,26,26,0.06),0_8px_24px_-12px_rgba(26,26,26,0.18)] ring-1 ring-brand-slate/10 transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(26,26,26,0.06),0_18px_36px_-16px_rgba(26,26,26,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gray motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className={`flex min-h-[8.5rem] flex-col justify-between gap-6 p-5 ${theme.block}`}>
        <ArticleBadges tema={card.tema} readingMinutes={card.readingMinutes} />
        <p className={`font-sans text-xs font-semibold uppercase leading-snug tracking-[0.12em] ${theme.muted}`}>
          {card.clusterNombre}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Heading className="line-clamp-3 font-display text-lg leading-snug text-brand-black [text-wrap:balance]">
          {card.title}
        </Heading>
        <div className="mt-auto pt-5">
          <hr className="border-brand-slate/15" />
          <div className="mt-4">
            <AuthorLine>
              <time dateTime={card.publishAt}>{card.fechaLarga}</time> · {card.readingMinutes} min
            </AuthorLine>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-black underline-offset-4 group-hover:underline">
            Leer el artículo
            <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogCardGrid({ cards, headingLevel = "h3" }: { cards: BlogCardData[]; headingLevel?: "h2" | "h3" }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.slug}>
          <BlogCard card={card} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
