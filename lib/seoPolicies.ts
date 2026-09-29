// Fuente única de verdad para las partes de datos estructurados
// (Product/Offer JSON-LD, /producto/[slug]) que Search Console reportó
// como faltantes: hasMerchantReturnPolicy y shippingDetails. Los valores
// de aquí DEBEN coincidir con lo publicado en /terminos (§6, "Política de
// cambios, devoluciones y garantía") y /politica-de-envios — cualquier
// cambio futuro a esos textos legales debe reflejarse aquí también.
//
// Los montos de envío (FORANEO_COST, FORANEO_MAX_STANDARD,
// FREE_SHIPPING_THRESHOLD) se importan de lib/checkout/constants.ts en vez
// de repetirse — es la misma fuente que ya usa el checkout real, así que
// el JSON-LD nunca puede quedar con un número distinto al que el cliente
// realmente paga.
//
// Discrepancias menores encontradas al comparar con el texto legal
// (reportadas, NO corregidas — no se tocó ningún texto legal):
// 1. /politica-de-envios §3 dice "de 3 a 48 horas" para envío local —
//    aquí se declara en días completos (0 a 2), que es lo que pidió el
//    cliente; 3 horas redondea a 0 días y 48 horas son exactamente 2
//    días, así que el rango es equivalente, solo con menos granularidad.
// 2. returnFees se declara como "el cliente paga" (ReturnShippingFees) —
//    la regla general de /terminos §6.3 — pero ese texto tiene una
//    excepción ("salvo que se trate de un error imputable a Ferretería
//    57") que schema.org no puede expresar en esta propiedad.
// 3. returnMethod incluye ReturnInStore (devolución en tienda física)
//    porque Ferretería 57 tiene sucursal física, pero el texto de
//    /terminos §6 no lo menciona explícitamente — solo habla del costo
//    de envío de devolución. Vale la pena confirmarlo con el negocio o
//    agregarlo al texto legal para que el markup y el texto coincidan
//    palabra por palabra.
// 4. merchantReturnLink apunta a /terminos, que tiene robots noindex
//    (ver NO_INDEX en lib/seo.ts) — Google puede seguir leyendo los datos
//    estructurados de una página con noindex sin problema (noindex solo
//    afecta si ESA página aparece en resultados de búsqueda, no si un
//    crawler puede visitarla), pero se reporta porque el enunciado lo
//    pidió explícitamente.
import { FORANEO_COST, FORANEO_MAX_STANDARD, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/constants";

// Sin import de lib/seo.ts a propósito (aunque merchantReturnLink
// necesita SITE_URL): ese módulo importaría de vuelta buildProductJsonLd
// desde aquí, y un ciclo de módulos arriesgaría que SITE_URL todavía sea
// undefined cuando este archivo se evalúa, según el orden de carga.
// buildMerchantReturnPolicy recibe siteUrl como parámetro en su lugar —
// quien la llama (buildProductJsonLd, en lib/seo.ts) ya tiene SITE_URL a
// mano de todas formas.
//
// /terminos §6.3: "dentro de un plazo de 5 días naturales... Ferretería 57
// realizará el reembolso o cambio" — ventana finita (no ilimitada, no "sin
// devoluciones"), 5 días, el cliente paga el envío de vuelta salvo error
// de la tienda, y la tienda elige entre reembolso o cambio caso por caso.
export function buildMerchantReturnPolicy(siteUrl: string) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "MX",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 5,
    returnFees: "https://schema.org/ReturnShippingFees",
    returnMethod: ["https://schema.org/ReturnByMail", "https://schema.org/ReturnInStore"],
    refundType: ["https://schema.org/FullRefund", "https://schema.org/ExchangeRefund"],
    merchantReturnLink: `${siteUrl}/terminos`,
  } as const;
}

// /politica-de-envios §4.1 y §4.3: costo fijo $250 MXN, empaque en 1 a 2
// días, tránsito de la paquetería en 2 a 6 días — solo para pedidos por
// debajo de FORANEO_MAX_STANDARD ($4,000); a partir de ese monto no se
// cotiza en automático (WhatsApp), así que esta tarifa no se declara.
function buildNationalShippingDetail() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: FORANEO_COST, currency: "MXN" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "MX" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "d" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 6, unitCode: "d" },
    },
  };
}

// /politica-de-envios §3: gratis a partir de FREE_SHIPPING_THRESHOLD
// ($599), entrega con unidad propia (sin paquetería) en 3 a 48 horas —
// declarado en días completos (0 a 2, ver discrepancia #1 arriba).
function buildLocalShippingDetail() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "MXN" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "MX", addressRegion: "Querétaro" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "d" },
      transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "d" },
    },
  };
}

// Devuelve solo las tarifas que de verdad aplican a este precio — nunca
// las dos fijas a la vez ni ninguna "por si acaso": un producto de $4,000+
// no debe prometer el envío foráneo de $250 (se cotiza aparte por
// WhatsApp) y uno de menos de $599 no debe prometer envío local gratis
// (depende de la colonia, todavía no se sabe el costo).
export function buildShippingDetails(price: number) {
  const details: ReturnType<typeof buildNationalShippingDetail | typeof buildLocalShippingDetail>[] = [];
  if (price < FORANEO_MAX_STANDARD) details.push(buildNationalShippingDetail());
  if (price >= FREE_SHIPPING_THRESHOLD) details.push(buildLocalShippingDetail());
  return details;
}

// Lanzamiento del catálogo real (supabase/migrations/
// 20260910060000_catalog.sql) — fallback de validFrom para productos sin
// created_at capturado (no debería pasar, la columna es not null default
// now(), pero cubre el caso de que algún día llegue null por una vía que
// no sea el flujo normal del admin).
export const SITE_LAUNCH_DATE = "2026-09-10T00:00:00-06:00";
