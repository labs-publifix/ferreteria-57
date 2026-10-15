import type { SearchResultItem } from "@/lib/catalog/search";

// Qué se llena al elegir un producto del catálogo en la compra en tienda:
// el nombre, el código que ve el cliente en la tienda en línea (la clave
// Truper; si no tiene, el SKU de la variante) y el precio en línea como
// monto sugerido, que el vendedor ajusta si fueron varias piezas.
export function club57CompraDesdeCatalogo(item: SearchResultItem): {
  producto: string;
  codigo: string;
  monto: string;
} {
  return {
    producto: item.name,
    codigo: item.clave?.trim() || item.sku?.trim() || "",
    monto: Number.isFinite(item.price) && item.price > 0 ? item.price.toFixed(2) : "",
  };
}
