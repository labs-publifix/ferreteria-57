const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Compartido por PriceTag (tienda pública) y las tablas del panel de
// administración — un solo formateador de MXN en vez de instanciar
// Intl.NumberFormat por separado en cada lugar que muestra un precio.
export function formatPrice(value: number): string {
  return currencyFormatter.format(value);
}
