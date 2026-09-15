"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useResolvedCart } from "@/components/cart/useResolvedCart";
import { Button } from "@/components/ui";
import { saveLastOrder } from "@/lib/checkout/lastOrder";
import { NO_LISTADA_KEY } from "@/lib/checkout/constants";
import {
  computeShipping,
  getLocalZoneCost,
  isForaneoOverLimit as computeForaneoOverLimit,
} from "@/lib/checkout/shippingCalculator";
import { isContactValid, isForaneoAddressValid, isLocalAddressValid } from "@/lib/checkout/validation";
import { useZonasEnvio } from "@/lib/checkout/useZonasEnvio";
import { buildForaneoWhatsAppUrl } from "@/lib/checkout/whatsapp";
import { ContactSection, emptyContact, type ContactForm } from "./ContactSection";
import {
  DeliverySection,
  emptyForaneoAddress,
  emptyLocalAddress,
  type DeliveryMethod,
  type ForaneoAddressForm,
  type LocalAddressForm,
} from "./DeliverySection";
import { PaymentSection, type PaymentMethod } from "./PaymentSection";
import { OrderSummary } from "./OrderSummary";

export function CheckoutView() {
  const router = useRouter();
  const { isHydrated, clearCart } = useCart();
  const { items, subtotal } = useResolvedCart();
  const { zonas } = useZonasEnvio();

  const [contact, setContact] = useState<ContactForm>(emptyContact);
  // "retiro" preseleccionado por default — cambio explícito respecto al
  // comportamiento anterior, que arrancaba en "envío".
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("retiro");
  const [localAddress, setLocalAddress] = useState<LocalAddressForm>(emptyLocalAddress);
  const [foraneoAddress, setForaneoAddress] = useState<ForaneoAddressForm>(emptyForaneoAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
  // Al confirmar el pedido, clearCart() deja `items` en 0 mientras esta
  // vista sigue montada (la navegación a /checkout/confirmacion no es
  // instantánea) — sin esta bandera, el efecto de abajo vería "carrito
  // vacío" y redirigiría a /carrito?empty=checkout, ganándole la carrera
  // a router.push hacia la confirmación. Una vez que se envió el pedido,
  // ya no tiene sentido evaluar esa redirección.
  const hasSubmittedRef = useRef(false);

  // Solo decidir "el carrito está vacío, redirigir" una vez que sabemos
  // de verdad qué había en localStorage — antes de eso, `items` está
  // vacío nada más porque todavía no se leyó, no porque el carrito lo
  // esté (ver CartProvider.isHydrated).
  useEffect(() => {
    if (hasSubmittedRef.current) return;
    if (isHydrated && items.length === 0) {
      router.replace("/carrito?empty=checkout");
    }
  }, [isHydrated, items.length, router]);

  if (!isHydrated || items.length === 0) return null;

  const foraneoOverLimit = deliveryMethod === "envio_foraneo" && computeForaneoOverLimit(subtotal);

  const shippingResult =
    deliveryMethod === "retiro"
      ? computeShipping({ method: "retiro" })
      : deliveryMethod === "envio_local"
        ? computeShipping({
            method: "envio_local",
            subtotal,
            zoneCost: localAddress.colonia ? getLocalZoneCost(localAddress.colonia, zonas) : null,
          })
        : computeShipping({ method: "envio_foraneo", subtotal });

  const shipping = shippingResult.cost;
  const total = subtotal + (shipping ?? 0);

  // Botón de avanzar deshabilitado de verdad (no solo validación nativa del
  // navegador) hasta que todos los campos obligatorios del flujo activo
  // sean válidos — requisito explícito del flujo 2. En foráneo con monto
  // excedido tampoco se puede completar el checkout estándar: ese caso lo
  // resuelve el CTA de WhatsApp dentro de DeliverySection, no este botón.
  const canSubmit =
    isContactValid(contact) &&
    (deliveryMethod === "retiro"
      ? true
      : deliveryMethod === "envio_local"
        ? isLocalAddressValid(localAddress)
        : isForaneoAddressValid(foraneoAddress) && !foraneoOverLimit);

  const whatsappUrl = buildForaneoWhatsAppUrl(
    items.map(({ product, variant, quantity }) => ({
      name: product.name,
      variantLabel: product.variants.length > 1 ? variant.label : null,
      quantity,
    })),
    subtotal
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    hasSubmittedRef.current = true;
    const orderNumber = `F57-${Date.now().toString(36).toUpperCase()}`;
    saveLastOrder({
      orderNumber,
      createdAt: new Date().toISOString(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      deliveryMethod,
      address:
        deliveryMethod === "envio_local"
          ? {
              city: "Querétaro",
              state: "Querétaro",
              colonia:
                localAddress.colonia === NO_LISTADA_KEY ? "No listada" : localAddress.colonia,
              street: localAddress.street,
              exteriorNumber: localAddress.exteriorNumber,
              interiorNumber: localAddress.interiorNumber,
              postalCode: localAddress.postalCode,
              references: localAddress.references,
            }
          : deliveryMethod === "envio_foraneo"
            ? {
                city: foraneoAddress.city,
                state: foraneoAddress.state,
                colonia: foraneoAddress.colonia,
                street: foraneoAddress.street,
                exteriorNumber: foraneoAddress.exteriorNumber,
                interiorNumber: foraneoAddress.interiorNumber,
                postalCode: foraneoAddress.postalCode,
                references: foraneoAddress.references,
              }
            : undefined,
      items: items.map(({ product, variant, quantity }) => ({
        name: product.name,
        variantLabel: product.variants.length > 1 ? variant.label : null,
        quantity,
        price: variant.price,
      })),
      subtotal,
      // canSubmit ya exigió una colonia elegida en envío local, así que
      // aquí `shipping` nunca es null en la práctica — el `?? 0` solo
      // satisface el tipo (number | null) que existe para el estado "aún
      // no se sabe" que se muestra ANTES de completar el formulario.
      shipping: shipping ?? 0,
      total,
    });
    clearCart();
    router.push("/checkout/confirmacion");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      {/* En móvil el resumen va primero (orden de aparición en el DOM):
          reafirma qué se está pagando antes de pedir que se llene un
          formulario largo. En escritorio se reacomoda a la derecha con
          lg:order-2, formulario a la izquierda con lg:order-1.
          El botón "Confirmar pedido" NO va pegado al resumen en móvil —
          verse justo después de llegar a la página, antes de llenar nada,
          es una CTA prematura. En su lugar hay dos botones (mismo <form>,
          ambos type=submit — válido en HTML tener más de uno), uno visible
          por breakpoint: el de escritorio vive junto al resumen en la
          barra lateral sticky; el de móvil cierra el formulario hasta
          abajo, después de rellenar contacto/entrega/pago.
          Cuando el envío foráneo excede el monto máximo, ninguno de los
          dos se muestra: el CTA de WhatsApp dentro de DeliverySection es
          la única acción disponible para ese caso. */}
      <div className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-6">
        <OrderSummary
          items={items}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          deliveryMethod={deliveryMethod}
          foraneoOverLimit={foraneoOverLimit}
        />
        {!foraneoOverLimit && (
          <div className="hidden lg:block">
            <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
              Confirmar pedido
            </Button>
            {!canSubmit && (
              <p className="mt-2 text-center font-sans text-xs text-brand-slate">
                Completa los campos marcados con * para continuar.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="order-2 flex flex-col gap-8 lg:order-1">
        <ContactSection contact={contact} onContactChange={setContact} />
        <DeliverySection
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={setDeliveryMethod}
          localAddress={localAddress}
          onLocalAddressChange={setLocalAddress}
          foraneoAddress={foraneoAddress}
          onForaneoAddressChange={setForaneoAddress}
          zonas={zonas}
          subtotal={subtotal}
          foraneoOverLimit={foraneoOverLimit}
          whatsappUrl={whatsappUrl}
        />
        <PaymentSection paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} />
        {!foraneoOverLimit && (
          <div className="lg:hidden">
            <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
              Confirmar pedido
            </Button>
            {!canSubmit && (
              <p className="mt-2 text-center font-sans text-xs text-brand-slate">
                Completa los campos marcados con * para continuar.
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
