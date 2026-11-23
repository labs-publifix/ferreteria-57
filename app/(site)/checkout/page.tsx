import type { Metadata } from "next";
import { CheckoutView, type CargoEmpresaCheckout } from "@/components/checkout/CheckoutView";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout — Ferretería 57",
  description: "Completa tu pedido: contacto, entrega y método de pago.",
  robots: NO_INDEX_NO_FOLLOW,
};

// Club 57 Empresarial: si quien compra tiene una empresa vinculada activa,
// el checkout ofrece «Cargo a mi empresa» con su crédito disponible. Se lee
// aquí, en el servidor, con la sesión; el pago en sí lo vuelve a validar
// club57_crear_pedido_empresa() al confirmar.
async function getCargoEmpresa(): Promise<{ cargoEmpresa: CargoEmpresaCheckout | null; isLoggedIn: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { cargoEmpresa: null, isLoggedIn: false };
    const { data } = await supabase.rpc("club57_mi_credito_empresa");
    const row = ((data ?? []) as Record<string, unknown>[])[0];
    if (!row) return { cargoEmpresa: null, isLoggedIn: true };
    return {
      isLoggedIn: true,
      cargoEmpresa: {
        empresa: String(row.empresa_nombre),
        activa: row.empresa_estado === "activa",
        disponible: Number(row.disponible),
        disponibleCompra: Number(row.disponible_compra),
        limitadoPorEmpresa: Boolean(row.limitado_por_empresa),
        plazoDias: Number(row.plazo_autorizacion_dias),
        cuentaEmail: user.email ?? "",
      },
    };
  } catch {
    return { cargoEmpresa: null, isLoggedIn: false };
  }
}

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Checkout de una sola página (no wizard): las 3
// secciones del formulario y el resumen conviven en la misma pantalla,
// todas dentro de un único <form> (ver CheckoutView) para que la
// validación nativa del navegador cubra el flujo completo al enviar.
export default async function CheckoutPage() {
  const { cargoEmpresa, isLoggedIn } = await getCargoEmpresa();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="mb-6 font-display text-2xl uppercase text-brand-slate sm:mb-8 sm:text-3xl">
        Checkout
      </h1>
      <CheckoutView cargoEmpresa={cargoEmpresa} isLoggedIn={isLoggedIn} />
    </main>
  );
}
