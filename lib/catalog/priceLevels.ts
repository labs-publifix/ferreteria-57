// Las 4 listas de precio de cada presentación (Precio 1 a Precio 4) y la
// regla de cuál es el «precio de tienda». Funciones puras: las comparten el
// formulario de producto, los importadores, la exportación y Configuración.
//
// En la base: product_price_levels guarda las 4 listas (solo el personal las
// ve) y product_variants.price es el precio de tienda (lo que ve el público),
// que siempre es igual a la lista elegida en price_settings.lista_tienda.

export type PriceList = 1 | 2 | 3 | 4;
export type PriceLevels = [number, number, number, number];

export const PRICE_LISTS: readonly PriceList[] = [1, 2, 3, 4];

/** Lista de tienda si la configuración no se puede leer (la de la migración). */
export const DEFAULT_STORE_LIST: PriceList = 2;

/** Cambio de precio de tienda a partir del cual el importador avisa. */
export const LARGE_CHANGE_PCT = 30;

export function isPriceList(value: unknown): value is PriceList {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function toPriceList(value: unknown): PriceList {
  const n = Number(value);
  return isPriceList(n) ? n : DEFAULT_STORE_LIST;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Lee un importe escrito a mano o en Excel: 150, "150.50", "$1,234.50",
 * "1234,5". Devuelve null si está vacío o no es un número.
 */
export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? roundMoney(value) : null;
  let text = String(value).trim().replace(/\$/g, "").replace(/\s+/g, "");
  if (!text) return null;
  if (text.includes(",") && text.includes(".")) {
    // 1,234.50 → separador de miles
    text = text.replace(/,/g, "");
  } else if (/^-?\d+,\d{1,2}$/.test(text)) {
    // 1234,5 → coma decimal
    text = text.replace(",", ".");
  } else {
    text = text.replace(/,/g, "");
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? roundMoney(n) : null;
}

/**
 * Las listas vacías toman el Precio 1 (la regla del formulario y de los
 * importadores). Devuelve null si falta el Precio 1.
 */
export function fillLevels(values: (number | null)[]): PriceLevels | null {
  const first = values[0];
  if (first === null || first === undefined) return null;
  return [0, 1, 2, 3].map((i) => {
    const v = values[i];
    return v === null || v === undefined ? first : v;
  }) as PriceLevels;
}

export function priceForList(levels: PriceLevels, list: PriceList): number {
  return levels[list - 1];
}

/** Lo esperado en Truper: Precio 1 ≥ Precio 2 ≥ Precio 3 ≥ Precio 4. */
export function isDescending(levels: PriceLevels): boolean {
  return levels[0] >= levels[1] && levels[1] >= levels[2] && levels[2] >= levels[3];
}

/** Cambio porcentual de `before` a `after` (null si `before` es 0). */
export function changePct(before: number, after: number): number | null {
  if (!(before > 0)) return null;
  return ((after - before) / before) * 100;
}

export function isLargeChange(before: number, after: number): boolean {
  const pct = changePct(before, after);
  return pct !== null && Math.abs(pct) >= LARGE_CHANGE_PCT;
}

/** Listas cuyo valor es igual al precio dado (para «coincide con Precio X»). */
export function matchingLists(levels: PriceLevels, price: number): PriceList[] {
  return PRICE_LISTS.filter((list) => Math.abs(priceForList(levels, list) - price) < 0.005);
}

export interface PriceLevelsRow {
  precio_1: number | string;
  precio_2: number | string;
  precio_3: number | string;
  precio_4: number | string;
}

export function levelsFromRow(row: PriceLevelsRow | null | undefined, fallback: number): PriceLevels {
  if (!row) return [fallback, fallback, fallback, fallback];
  return [Number(row.precio_1), Number(row.precio_2), Number(row.precio_3), Number(row.precio_4)];
}

export function levelsToRow(levels: PriceLevels) {
  return { precio_1: levels[0], precio_2: levels[1], precio_3: levels[2], precio_4: levels[3] };
}

/** PostgREST entrega la relación 1 a 1 como objeto o como arreglo. */
export function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
