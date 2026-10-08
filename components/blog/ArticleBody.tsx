import { Info, Lightbulb, Link2, ShieldAlert } from "lucide-react";
import type { BlogArticle } from "@/lib/blog/content";
import { GuiaClubCta } from "./GuiaClubCta";
import { InlineText } from "./InlineText";

const CALLOUT = {
  consejo: { label: "Consejo", Icon: Lightbulb, box: "bg-brand-orange/10", badge: "bg-brand-orange text-brand-black" },
  seguridad: { label: "Seguridad", Icon: ShieldAlert, box: "bg-brand-black/[0.06]", badge: "bg-brand-black text-white" },
  nota: { label: "Nota", Icon: Info, box: "bg-brand-gray", badge: "bg-brand-slate text-white" },
} as const;

function HeadingAnchor({ id, text }: { id: string; text: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label={`Enlace a la sección «${text}»`}
      className="ml-2 inline-flex size-8 translate-y-[-2px] items-center justify-center rounded-md align-middle text-brand-slate opacity-0 transition-opacity hover:bg-brand-gray focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate group-hover:opacity-100 motion-reduce:transition-none"
    >
      <Link2 className="size-4" aria-hidden="true" />
    </a>
  );
}

// Cuerpo del artículo: un bloque del esquema → un elemento semántico. Todo
// el texto pasa por InlineText (React escapa; no hay HTML crudo).
export function ArticleBody({
  article,
  topicSlugs,
  ctaAnchorId,
}: {
  article: BlogArticle;
  topicSlugs: Record<string, string>;
  ctaAnchorId?: string;
}) {
  return (
    <div className="font-sans text-[17px] leading-[1.7] text-brand-black/90 sm:text-[18px]">
      {article.blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "h2": {
            const id = article.headingIds[index]!;
            return (
              <h2
                key={key}
                id={id}
                data-toc-heading
                className="group mt-14 scroll-mt-24 font-display text-[1.45rem] uppercase leading-tight text-brand-slate [text-wrap:balance] first:mt-0 sm:text-[1.7rem]"
              >
                {block.text}
                <HeadingAnchor id={id} text={block.text} />
              </h2>
            );
          }
          case "h3": {
            const id = article.headingIds[index]!;
            return (
              <h3 key={key} id={id} className="group mt-9 scroll-mt-24 font-sans text-xl font-bold leading-snug text-brand-black [text-wrap:balance]">
                {block.text}
                <HeadingAnchor id={id} text={block.text} />
              </h3>
            );
          }
          case "p":
            return (
              <p key={key} className="mt-5">
                <InlineText text={block.text} topicSlugs={topicSlugs} />
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="mt-5 flex flex-col gap-2.5 pl-1">
                {block.items.map((item, i) => (
                  <li key={i} className="relative pl-6 before:absolute before:left-0 before:top-[0.72em] before:size-2 before:rounded-[2px] before:bg-brand-orange">
                    <InlineText text={item} topicSlugs={topicSlugs} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="mt-5 flex list-decimal flex-col gap-2.5 pl-6 marker:font-semibold marker:text-brand-slate">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    <InlineText text={item} topicSlugs={topicSlugs} />
                  </li>
                ))}
              </ol>
            );
          case "table": {
            const captionId = `tabla-${index}`;
            return (
              <figure key={key} className="mt-8">
                <div
                  role="region"
                  aria-labelledby={captionId}
                  tabIndex={0}
                  className="overflow-x-auto rounded-xl ring-1 ring-brand-slate/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                >
                  <table className="w-full min-w-[34rem] border-collapse text-left text-[15px] leading-normal">
                    <caption id={captionId} className="bg-brand-slate px-4 py-3 text-left font-sans text-sm font-semibold text-white">
                      {block.caption}
                    </caption>
                    <thead>
                      <tr className="bg-brand-gray">
                        {block.headers.map((header) => (
                          <th key={header} scope="col" className="px-4 py-3 font-sans text-xs font-bold uppercase tracking-[0.08em] text-brand-slate">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r} className="border-t border-brand-slate/10 align-top">
                          {row.map((cell, c) =>
                            c === 0 ? (
                              <th key={c} scope="row" className="px-4 py-3 font-semibold text-brand-black">
                                <InlineText text={cell} topicSlugs={topicSlugs} />
                              </th>
                            ) : (
                              <td key={c} className="px-4 py-3 text-brand-black/85">
                                <InlineText text={cell} topicSlugs={topicSlugs} />
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figcaption className="mt-2 font-sans text-xs text-brand-slate sm:hidden">Desliza la tabla para ver todas las columnas.</figcaption>
              </figure>
            );
          }
          case "callout": {
            const style = CALLOUT[block.variant];
            return (
              <aside key={key} aria-label={block.title ?? style.label} className={`mt-8 flex gap-4 rounded-2xl p-5 sm:p-6 ${style.box}`}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${style.badge}`} aria-hidden="true">
                  <style.Icon className="size-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 text-[16px] leading-relaxed sm:text-[17px]">
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-brand-slate">{style.label}</p>
                  {block.title && <p className="mt-1 font-semibold text-brand-black">{block.title}</p>}
                  <p className="mt-1">
                    <InlineText text={block.text} topicSlugs={topicSlugs} />
                  </p>
                </div>
              </aside>
            );
          }
          case "steps":
            return (
              <ol key={key} className="mt-8 flex flex-col gap-0">
                {block.items.map((item, i) => (
                  <li key={i} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < block.items.length - 1 && <span aria-hidden="true" className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-brand-slate/20" />}
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-slate font-display text-sm text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-1.5">
                      <p className="font-bold leading-snug text-brand-black">
                        <span className="sr-only">Paso {i + 1}: </span>
                        {item.title}
                      </p>
                      <p className="mt-1.5">
                        <InlineText text={item.text} topicSlugs={topicSlugs} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "cta":
            return <GuiaClubCta key={key} slug={article.slug} guiaTitulo={article.guia.titulo} variant="inline" anchorId={ctaAnchorId} />;
        }
      })}
    </div>
  );
}
