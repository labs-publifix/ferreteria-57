// ¿Lo que cobró Mercado Pago coincide con el total guardado del pedido?
// Tolerancia de un centavo por redondeos. Un monto ausente o no numérico
// nunca se da por bueno.
export function paymentMatchesOrderTotal(paid: unknown, orderTotal: unknown): boolean {
  const amount = Number(paid);
  const total = Number(orderTotal);
  if (paid === null || paid === undefined || !Number.isFinite(amount) || !Number.isFinite(total)) return false;
  return Math.abs(amount - total) <= 0.01;
}
