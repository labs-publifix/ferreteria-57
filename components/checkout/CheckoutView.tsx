"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useResolvedCart } from "@/components/cart/useResolvedCart";
import { Button } from "@/components/ui";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/checkout/constants";
import { saveLastOrder } from "@/lib/checkout/lastOrder";
import { ContactSection } from "./ContactSection";
import {
  DeliverySection,
  emptyAddress,
  type AddressForm,
  type DeliveryMethod,
} from "./DeliverySection";
import { PaymentSection, type PaymentMethod } from "./PaymentSection";
import { OrderSummary } from "./OrderSummary";

export function CheckoutView() {
  const router = useRouter();
  const { isHydrated, clearCart } = useCart();
  const { items, subtotal } = useResolvedCart();

  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("envio");
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
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

  const shipping =
    deliveryMethod === "retiro" || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Si llegamos aquí, la validación nativa del <form> (email requerido
    // con formato válido y, si aplica, los campos de dirección) ya pasó
    // — el navegador no deja enviar el formulario si algo requerido falta.
    hasSubmittedRef.current = true;
    const orderNumber = `F57-${Date.now().toString(36).toUpperCase()}`;
    saveLastOrder({
      orderNumber,
      createdAt: new Date().toISOString(),
      email,
      deliveryMethod,
      items: items.map(({ product, variant, quantity }) => ({
        name: product.name,
        variantLabel: product.variants.length > 1 ? variant.label : null,
        quantity,
        price: variant.price,
      })),
      subtotal,
      shipping,
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
          abajo, después de rellenar contacto/entrega/pago. */}
      <div className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-6">
        <OrderSummary
          items={items}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          deliveryMethod={deliveryMethod}
        />
        <div className="hidden lg:block">
          <Button type="submit" variant="primary" className="w-full">
            Confirmar pedido
          </Button>
        </div>
      </div>

      <div className="order-2 flex flex-col gap-8 lg:order-1">
        <ContactSection email={email} onEmailChange={setEmail} />
        <DeliverySection
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={setDeliveryMethod}
          address={address}
          onAddressChange={setAddress}
        />
        <PaymentSection paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod} />
        <div className="lg:hidden">
          <Button type="submit" variant="primary" className="w-full">
            Confirmar pedido
          </Button>
        </div>
      </div>
    </form>
  );
}
