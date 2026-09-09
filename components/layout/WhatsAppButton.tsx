import { MessageCircle } from "lucide-react";

// Mismo teléfono que "Atención a clientes" (Header/Footer). Si el número de
// WhatsApp de ventas termina siendo distinto, cambiar solo esta constante.
const WHATSAPP_PHONE = "524427782708";

// z-40: por debajo del overlay del menú móvil (z-50 en Header), para que al
// abrir el menú el botón quede correctamente detrás del fondo oscurecido en
// vez de flotar encima. bottom-6/right-4 lo aleja de cualquier borde de
// pantalla; no hay ningún otro control fijo en el sitio con el que pueda
// chocar (el carrito vive en el header, no en la esquina inferior).
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-6 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-brand-orange text-brand-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 sm:right-6"
    >
      <MessageCircle className="size-7" aria-hidden="true" strokeWidth={1.75} />
    </a>
  );
}
