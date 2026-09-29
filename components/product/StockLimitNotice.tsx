import { buttonClassName } from "@/components/ui";
import { buildStockInquiryWhatsAppUrl } from "@/lib/checkout/whatsapp";

interface StockLimitNoticeProps {
  productName: string;
  sku?: string | null;
  clave?: string | null;
  /** null cuando el producto está agotado (sin tope numérico que mostrar);
   *  un número cuando sí hay existencia pero se llegó al máximo. */
  available: number | null;
  /** Cantidad que el cliente ya tiene/quiere — solo se usa para redactar
   *  el mensaje de WhatsApp, nunca se muestra el inventario total aparte
   *  de este número puntual. */
  desiredQuantity: number;
  /** true cuando la cantidad mostrada YA se recortó sola (el carrito tenía
   *  más de lo que hay ahora) — cambia la redacción a "ajustamos" en vez
   *  de "solo tenemos", para que quede claro que algo cambió sin que el
   *  cliente lo tocara. */
  wasReduced?: boolean;
  className?: string;
}

// Aviso discreto + botón secundario de WhatsApp — mismo componente para
// "tope de stock alcanzado" (ficha, carrito) y "agotado" (ficha): solo
// cambia la redacción según `available`/`wasReduced`, nunca la estructura,
// para no duplicar este bloque en cada lugar que lo necesita.
export function StockLimitNotice({
  productName,
  sku,
  clave,
  available,
  desiredQuantity,
  wasReduced = false,
  className = "",
}: StockLimitNoticeProps) {
  const url = buildStockInquiryWhatsAppUrl(
    { name: productName, sku, clave },
    { desiredQuantity, available }
  );
  const message =
    available === null || available === 0
      ? "Este producto está agotado por ahora."
      : wasReduced
        ? `Ajustamos tu cantidad a ${available} — es lo único que tenemos disponible.`
        : `Solo tenemos ${available} ${available === 1 ? "unidad disponible" : "unidades disponibles"}.`;

  return (
    <div className={`flex flex-col items-start gap-2 rounded-md bg-brand-gray px-3 py-2.5 ${className}`}>
      <p className="font-sans text-sm text-brand-black">{message}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName("secondary", "min-h-9 px-4 py-1.5 text-sm")}
      >
        ¿Necesitas más unidades? Contáctanos por WhatsApp
      </a>
    </div>
  );
}
