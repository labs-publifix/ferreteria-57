// Funciones puras de cálculo de envío — sin dependencias de React/Supabase
// para poder probarlas con datos sintéticos (ver plan de verificación) antes
// de conectarlas a CheckoutView. Toda la lógica de las 3 modalidades vive
// aquí, en un solo lugar, para que /carrito (teaser genérico) y /checkout
// (costo real ya con colonia elegida) nunca queden con números distintos.
import { FORANEO_COST, FORANEO_MAX_STANDARD, FREE_SHIPPING_THRESHOLD, NO_LISTADA_COST, NO_LISTADA_KEY } from "./constants";
import type { ZonaEnvio } from "./useZonasEnvio";

export type DeliveryMethod = "retiro" | "envio_local" | "envio_foraneo";

export interface ShippingResult {
  // null cuando el envío local todavía no tiene colonia elegida y el
  // subtotal no alcanza el umbral de envío gratis — en ese caso el costo
  // real es "todavía no se sabe", no $0 (mostrarlo como $0 sería un falso
  // "envío gratis" antes de que el cliente elija su colonia).
  cost: number | null;
  isFree: boolean;
}

// El combobox de colonia guarda el nombre real de la colonia como value, o
// el sentinel NO_LISTADA_KEY cuando el cliente eligió "Mi colonia no
// aparece en la lista" — este helper traduce ese value al costo en pesos,
// sin que el resto del código necesite saber de sentinels.
export function getLocalZoneCost(coloniaValue: string, zonas: ZonaEnvio[]): number {
  if (coloniaValue === NO_LISTADA_KEY) return NO_LISTADA_COST;
  const zona = zonas.find((z) => z.colonia === coloniaValue);
  return zona ? zona.costoEnvioMxn : NO_LISTADA_COST;
}

export type ShippingInput =
  | { method: "retiro" }
  | { method: "envio_local"; subtotal: number; zoneCost: number | null }
  | { method: "envio_foraneo"; subtotal: number };

// La promoción de envío gratis ($599 MXN) solo aplica a envío local — el
// enunciado del negocio es explícito en que foráneo queda fuera, por eso
// "envio_foraneo" nunca consulta FREE_SHIPPING_THRESHOLD.
export function computeShipping(input: ShippingInput): ShippingResult {
  switch (input.method) {
    case "retiro":
      return { cost: 0, isFree: true };
    case "envio_local":
      if (input.subtotal >= FREE_SHIPPING_THRESHOLD) return { cost: 0, isFree: true };
      return { cost: input.zoneCost, isFree: false };
    case "envio_foraneo":
      return { cost: FORANEO_COST, isFree: false };
  }
}

// "Te faltan $XX para envío gratis" — 0 cuando ya se alcanzó el umbral, así
// el llamador puede usar > 0 directo como condición de "todavía falta".
export function amountRemainingForFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

// A partir de este subtotal, envío foráneo ya no se cotiza en automático:
// hay que escalar por WhatsApp (ver DeliverySection, flujo 3).
export function isForaneoOverLimit(subtotal: number): boolean {
  return subtotal >= FORANEO_MAX_STANDARD;
}
