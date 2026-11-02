import { Plus } from "lucide-react";
import { InlineText } from "./InlineText";

// Preguntas frecuentes con <details>/<summary>: el texto completo va en el
// HTML (lo leen buscadores y lectores de pantalla) y funciona sin JS.
export function ArticleFaq({ faq, topicSlugs }: { faq: { q: string; a: string }[]; topicSlugs: Record<string, string> }) {
  if (faq.length === 0) return null;
  return (
    <section aria-labelledby="preguntas-frecuentes" className="mt-16">
      <h2
        id="preguntas-frecuentes"
        data-toc-heading
        className="scroll-mt-24 font-display text-[1.45rem] uppercase leading-tight text-brand-slate sm:text-[1.7rem]"
      >
        Preguntas frecuentes
      </h2>
      <div className="mt-6 divide-y divide-brand-slate/15 border-y border-brand-slate/15">
        {faq.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-sans text-[17px] font-semibold leading-snug text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate [&::-webkit-details-marker]:hidden">
              <h3>{item.q}</h3>
              <Plus className="size-5 shrink-0 text-brand-slate transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <div className="pb-5 pr-9 font-sans text-[17px] leading-[1.7] text-brand-black/85">
              <p>
                <InlineText text={item.a} topicSlugs={topicSlugs} />
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
