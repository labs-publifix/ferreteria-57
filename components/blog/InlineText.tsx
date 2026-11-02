import Link from "next/link";
import { parseInline } from "@/lib/blog/inline";

// Pinta texto con sintaxis en línea (lib/blog/inline.ts) como nodos de
// React: todo el texto pasa por React, que lo escapa. `topicSlugs` resuelve
// [[B04|ancla]] al slug del artículo (validado en build).
export function InlineText({ text, topicSlugs }: { text: string; topicSlugs: Record<string, string> }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        switch (token.type) {
          case "text":
            return <span key={index}>{token.value}</span>;
          case "strong":
            return (
              <strong key={index} className="font-semibold text-brand-black">
                {token.value}
              </strong>
            );
          case "link":
            return (
              <Link key={index} href={token.href} className="font-medium text-brand-black underline decoration-brand-orange decoration-2 underline-offset-[3px] hover:decoration-brand-black">
                {token.text}
              </Link>
            );
          case "topic": {
            const slug = topicSlugs[token.topicId];
            return slug ? (
              <Link key={index} href={`/blog/${slug}`} className="font-medium text-brand-black underline decoration-brand-orange decoration-2 underline-offset-[3px] hover:decoration-brand-black">
                {token.text}
              </Link>
            ) : (
              <span key={index}>{token.text}</span>
            );
          }
        }
      })}
    </>
  );
}
