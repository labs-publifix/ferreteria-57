import { WhatsAppIcon } from "@/components/layout/WhatsAppButton";
import {
  NO_ENCUENTRAS_TEXTO,
  NO_ENCUENTRAS_TITULO,
  noEncuentrasWhatsAppUrl,
  type NoEncuentrasContexto,
} from "@/lib/whatsapp/noEncuentras";

// Aviso «¿No encuentras tu producto?» con botón a WhatsApp (mismo número de
// la tienda). «destacado»: búsqueda sin resultados o con pocos. «discreto»:
// renglón al final de cada categoría, para todos los visitantes.
export function NoEncuentrasWhatsApp({
  variante = "destacado",
  ...contexto
}: NoEncuentrasContexto & { variante?: "destacado" | "discreto" }) {
  const href = noEncuentrasWhatsAppUrl(contexto);

  if (variante === "discreto") {
    return (
      <p className="mt-10 flex flex-col items-start gap-2 border-t border-brand-slate/15 pt-6 font-sans text-sm text-brand-slate sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong className="text-brand-black">{NO_ENCUENTRAS_TITULO}</strong> {NO_ENCUENTRAS_TEXTO}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-brand-black underline underline-offset-2 hover:text-brand-slate"
        >
          <WhatsAppIcon className="size-4" />
          Escríbenos por WhatsApp
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border-l-4 border-brand-orange bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-base uppercase text-brand-slate">{NO_ENCUENTRAS_TITULO}</p>
        <p className="mt-1 font-sans text-sm text-brand-black">{NO_ENCUENTRAS_TEXTO}</p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-orange px-5 font-sans text-sm font-semibold text-brand-black transition-colors hover:bg-[#E65C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="size-5" />
        Escríbenos por WhatsApp
      </a>
    </div>
  );
}
