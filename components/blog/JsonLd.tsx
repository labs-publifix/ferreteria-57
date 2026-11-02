import { serializeJsonLd } from "@/lib/blog/seo";

// <script type="application/ld+json"> con el JSON escapado (serializeJsonLd
// convierte "<" en <): el contenido nunca puede cerrar la etiqueta.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
