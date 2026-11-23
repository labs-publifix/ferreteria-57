"use client";

import { PriceTag } from "@/components/ui";
import { formatPrice } from "@/lib/formatPrice";
import { useMemberPrices } from "./MemberPricesProvider";

// Precio de una presentación como lo ve cada visitante: el de tienda para
// todos y, si quien tiene la sesión es miembro con lista y le sale más
// barato, «Tu precio Club 57» debajo. Nunca se menciona el número de lista.
export function ClubPriceTag({
  variantId,
  price,
  previousPrice,
  hideBadge = false,
  compact = false,
}: {
  variantId: string | undefined;
  price: number;
  previousPrice?: number;
  hideBadge?: boolean;
  /** Tarjetas: renglón Club 57 más chico. */
  compact?: boolean;
}) {
  const { getMemberPrice } = useMemberPrices(variantId ? [variantId] : []);
  const memberPrice = variantId ? getMemberPrice(variantId) : undefined;
  const showMember = memberPrice !== undefined && memberPrice < price;

  if (!showMember) return <PriceTag price={price} previousPrice={previousPrice} hideBadge={hideBadge} />;

  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-xs text-brand-slate/70">Precio tienda</span>
      <PriceTag price={price} previousPrice={previousPrice} hideBadge={hideBadge} />
      <p
        className={`flex flex-wrap items-baseline gap-x-1.5 rounded-md bg-brand-orange/10 font-sans text-brand-black ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        <span>Tu precio Club 57</span>
        <strong className={compact ? "text-sm" : "text-lg"}>{formatPrice(memberPrice)}</strong>
      </p>
    </div>
  );
}
