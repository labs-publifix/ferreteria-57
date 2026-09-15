const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Compartido por PriceTag (tienda pública), el carrito, el checkout y las
// tablas del panel de administración — un solo formateador de MXN en vez
// de instanciar Intl.NumberFormat por separado en cada lugar que muestra
// un precio. El sufijo "MXN" es explícito: el símbolo "$" que arma
// Intl para es-MX es indistinguible de un dólar a simple vista, y esta
// tienda no maneja otra moneda que pudiera confundirse.
export function formatPrice(value: number): string {
  return `${currencyFormatter.format(value)} MXN`;
}
