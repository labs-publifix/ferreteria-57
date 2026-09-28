// Lista de destinatarios del negocio para avisos internos (nuevo pedido,
// solicitud de canje de Club 57, etc.) — antes vivía duplicada solo dentro
// de app/api/mercadopago/webhook/route.ts; se comparte aquí para que
// cualquier otro correo interno (como el de canjes) use exactamente la
// misma lista, sin arriesgar que las dos copias se desalineen.
const BUSINESS_NOTIFICATION_EMAILS = ["labs.publifix@gmail.com", "ferreteria57qro@hotmail.com"];

// Lista adicional configurable por entorno (coma-separada) para no tener que
// tocar código cada vez que el negocio quiera sumar/quitar una bandeja de
// aviso — ver ORDER_NOTIFICATION_EXTRA_RECIPIENTS en .env.example. Se
// combina (Set) con BUSINESS_NOTIFICATION_EMAILS en vez de reemplazarla:
// ningún destinatario actual se pierde.
export function getBusinessNotificationRecipients(): string[] {
  const extra = (process.env.ORDER_NOTIFICATION_EXTRA_RECIPIENTS ?? "ferreteria57qro@gmail.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  return Array.from(new Set([...BUSINESS_NOTIFICATION_EMAILS, ...extra]));
}
