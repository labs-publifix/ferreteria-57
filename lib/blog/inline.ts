// Sintaxis en línea del contenido del blog — parser propio, sin MDX ni
// HTML. Produce una lista de tokens que React pinta como texto (React
// escapa todo), así que nunca hay dangerouslySetInnerHTML con texto del
// artículo: un "<script>" escrito en el contenido se muestra literal.
//
//   **negrita**          → strong (sin anidar)
//   [texto](/ruta)       → enlace interno (ruta relativa "/..." o "#ancla")
//   [[B04|ancla]]        → enlace a otro artículo del blog por su topicId;
//                          se valida en build (lib/blog/content.ts)
//
// Cualquier marca sin cerrar o mal formada es un error: el build falla con
// el fragmento exacto, en vez de publicar asteriscos sueltos.

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "link"; href: string; text: string }
  | { type: "topic"; topicId: string; text: string };

export class InlineSyntaxError extends Error {
  constructor(message: string, source: string) {
    super(`${message} — en: «${source.length > 120 ? `${source.slice(0, 117)}…` : source}»`);
    this.name = "InlineSyntaxError";
  }
}

const TOPIC_ID = /^B\d{2,3}$/;

// Ruta interna: "/algo" (nunca "//host", que el navegador trata como
// externo) o un ancla "#id" de la misma página. Sin espacios ni "\".
export function isInternalHref(href: string): boolean {
  if (/[\s\\]/.test(href)) return false;
  if (href.startsWith("#")) return href.length > 1;
  return href.startsWith("/") && !href.startsWith("//");
}

export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) tokens.push({ type: "text", value: buffer });
    buffer = "";
  };

  while (i < source.length) {
    if (source.startsWith("**", i)) {
      const end = source.indexOf("**", i + 2);
      if (end === -1) throw new InlineSyntaxError("Negrita sin cerrar (falta **)", source);
      const value = source.slice(i + 2, end);
      if (!value.trim()) throw new InlineSyntaxError("Negrita vacía", source);
      if (/\[|\]|\*/.test(value)) throw new InlineSyntaxError("La negrita no puede contener enlaces ni otra marca", source);
      flush();
      tokens.push({ type: "strong", value });
      i = end + 2;
      continue;
    }

    if (source.startsWith("[[", i)) {
      const end = source.indexOf("]]", i + 2);
      if (end === -1) throw new InlineSyntaxError("Enlace a artículo sin cerrar (falta ]])", source);
      const inner = source.slice(i + 2, end);
      const sep = inner.indexOf("|");
      const topicId = sep === -1 ? inner : inner.slice(0, sep);
      const text = sep === -1 ? "" : inner.slice(sep + 1);
      if (!TOPIC_ID.test(topicId)) throw new InlineSyntaxError(`Enlace a artículo con id inválido "${topicId}" (usa [[B04|ancla]])`, source);
      if (!text.trim() || /[[\]*|]/.test(text)) throw new InlineSyntaxError(`Enlace a ${topicId} sin texto de ancla válido (usa [[${topicId}|ancla]])`, source);
      flush();
      tokens.push({ type: "topic", topicId, text });
      i = end + 2;
      continue;
    }

    if (source[i] === "[") {
      const close = source.indexOf("](", i + 1);
      const end = close === -1 ? -1 : source.indexOf(")", close + 2);
      if (close === -1 || end === -1) throw new InlineSyntaxError("Enlace mal formado (usa [texto](/ruta))", source);
      const text = source.slice(i + 1, close);
      const href = source.slice(close + 2, end);
      if (!text.trim() || /[[\]*]/.test(text)) throw new InlineSyntaxError("Enlace sin texto válido", source);
      if (!isInternalHref(href)) throw new InlineSyntaxError(`Solo se permiten rutas internas ("/ruta" o "#ancla"), no "${href}"`, source);
      flush();
      tokens.push({ type: "link", href, text });
      i = end + 1;
      continue;
    }

    if (source[i] === "]") throw new InlineSyntaxError('"]" suelto', source);

    buffer += source[i];
    i += 1;
  }
  flush();
  return tokens;
}

export function inlineToPlainText(source: string): string {
  return parseInline(source)
    .map((token) => (token.type === "text" || token.type === "strong" ? token.value : token.text))
    .join("");
}

export function topicRefs(source: string): string[] {
  return parseInline(source).flatMap((token) => (token.type === "topic" ? [token.topicId] : []));
}
