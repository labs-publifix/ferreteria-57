import { formatPrice } from "@/lib/formatPrice";
import { Badge } from "./Badge";

export interface PriceTagProps {
  /** Precio actual, en pesos mexicanos (MXN). */
  price: number;
  /** Precio anterior, cuando existe descuento. Debe ser mayor que `price`. */
  previousPrice?: number;
  className?: string;
  /**
   * Oculta el Badge inline de "Ahorra X%". Úsalo cuando el contenedor que
   * envuelve a PriceTag ya muestra su propio badge de descuento (p. ej.
   * ProductCard, sobre la imagen) para no repetir el mismo dato dos veces
   * en la misma tarjeta. El precio tachado se conserva: sí aporta un dato
   * nuevo (cuánto costaba antes).
   */
  hideBadge?: boolean;
}

// El naranja marca "precios activos" (con descuento) mediante un badge
// inline reutilizando <Badge>, nunca coloreando el texto del precio: el
// naranja como color de TEXTO da ~2.6-2.9:1 de contraste sobre blanco o
// gris claro, por debajo del mínimo 4.5:1 (ver resumen de la conversación).
export function PriceTag({
  price,
  previousPrice,
  className = "",
  hideBadge = false,
}: PriceTagProps) {
  const hasDiscount = typeof previousPrice === "number" && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((previousPrice - price) / previousPrice) * 100)
    : null;

  const currentFormatted = formatPrice(price);
  const previousFormatted = hasDiscount ? formatPrice(previousPrice) : null;

  const accessibleLabel = hasDiscount
    ? `Precio actual: ${currentFormatted}. Antes: ${previousFormatted}. Ahorras ${discountPercent}%.`
    : `Precio: ${currentFormatted}.`;

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}
      role="group"
      aria-label={accessibleLabel}
    >
      <span
        className="font-sans text-2xl font-bold text-brand-black sm:text-3xl"
        aria-hidden="true"
      >
        {currentFormatted}
      </span>
      {hasDiscount && (
        <>
          <s
            className="font-sans text-sm text-brand-slate sm:text-base"
            aria-hidden="true"
          >
            {previousFormatted}
          </s>
          {!hideBadge && (
            <Badge aria-hidden="true">Ahorra {discountPercent}%</Badge>
          )}
        </>
      )}
    </div>
  );
}
