import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import type { ResolvedCartLine } from "@/components/cart/useResolvedCart";
import type { DeliveryMethod } from "./DeliverySection";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  deliveryMethod,
}: {
  items: ResolvedCartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  deliveryMethod: DeliveryMethod;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-brand-gray p-4 sm:p-6">
      <h2 className="font-display text-lg uppercase text-brand-slate">
        Resumen de tu pedido
      </h2>

      <div className="flex flex-col gap-3">
        {items.map(({ product, variant, quantity }) => (
          <div key={`${product.id}-${variant.id}`} className="flex gap-3">
            <ProductThumbnail product={product} className="size-14 shrink-0" />
            <div className="flex flex-1 flex-col">
              <p className="line-clamp-2 font-sans text-sm text-brand-black">
                {product.name}
              </p>
              {product.variants.length > 1 && (
                <p className="font-sans text-xs text-brand-slate/70">{variant.label}</p>
              )}
              <p className="font-sans text-xs text-brand-slate">Cantidad: {quantity}</p>
            </div>
            <p className="shrink-0 font-sans text-sm font-semibold text-brand-black">
              {currencyFormatter.format(variant.price * quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-brand-slate/15 pt-4 font-sans text-sm text-brand-black">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{currencyFormatter.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <span>{shipping === 0 ? "Gratis" : currencyFormatter.format(shipping)}</span>
        </div>
        {deliveryMethod === "envio" && shipping > 0 && (
          <p className="font-sans text-xs text-brand-slate/60">
            *Costo de envío de ejemplo; envíos gratis desde $950 MXN.
          </p>
        )}
        <div className="flex justify-between border-t border-brand-slate/15 pt-2 text-base font-bold">
          <span>Total</span>
          <span>{currencyFormatter.format(total)}</span>
        </div>
      </div>
    </div>
  );
}
