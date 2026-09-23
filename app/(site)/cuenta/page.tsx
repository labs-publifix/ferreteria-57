import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AuthTabs } from "@/components/account/AuthTabs";
import { ProfileView } from "@/components/account/ProfileView";
import {
  Club57MemberPanel,
  type Club57CatalogItem,
  type Club57LedgerRow,
  type Club57OrderRow,
  type Club57RedemptionRow,
} from "@/components/account/Club57MemberPanel";
import type { Club57OrderItemRow } from "@/components/account/Club57OrderDetailModal";
import { NO_INDEX_NO_FOLLOW } from "@/lib/seo";

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx.
export const metadata: Metadata = {
  title: "Mi cuenta — Ferretería 57",
  description:
    "Inicia sesión o crea tu cuenta de Ferretería 57. Al registrarte ya formas parte del Programa de Lealtad.",
  robots: NO_INDEX_NO_FOLLOW,
};

// Server Component: decide qué mostrar (formulario o perfil) leyendo la
// sesión del lado del servidor con el cliente de lib/supabase/server.ts,
// para que la primera pintura ya llegue correcta (sin parpadeo mostrando
// primero el formulario y luego el perfil una vez resuelto el cliente).
export default async function CuentaPage({
  searchParams,
}: {
  searchParams: { passwordReset?: string };
}) {
  // Si todavía no se agregaron las variables de entorno en Vercel, esta
  // página es la única que depende de ellas de forma directa (el resto
  // del sitio sigue funcionando, ver AuthProvider/middleware) — mejor un
  // aviso claro que la pantalla de error genérica de Next.js.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="font-display text-2xl uppercase text-brand-slate">
          Mi cuenta
        </h1>
        <p className="max-w-prose font-sans text-sm text-brand-black">
          Esta sección está en configuración — vuelve más tarde.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; referral_code: string | null } | null = null;
  let saldoDisponible = 0;
  let puntosPendientes = 0;
  let proximaFechaDisponible: string | null = null;
  let historial: Club57LedgerRow[] = [];
  let catalogo: Club57CatalogItem[] = [];
  let misCanjes: Club57RedemptionRow[] = [];
  let pedidos: Club57OrderRow[] = [];
  let montoPorPunto = 50;
  let bonoReferidoPendientePts: number | null = null;

  if (user) {
    // Los puntos 'pendiente' cuya fecha_disponible ya llegó se pasan a
    // 'disponible' aquí — "al cargar el panel de cliente" es la
    // implementación aceptada para esta primera versión (sin cron todavía,
    // ver migración 20260925010000). Se espera a que termine antes de leer
    // el ledger para que el saldo mostrado ya refleje la transición.
    await supabase.rpc("promote_due_club57_points");

    const [profileResult, memberResult, ledgerResult, catalogResult, redemptionsResult, ordersResult, configResult] =
      await Promise.all([
        supabase.from("profiles").select("full_name, referral_code").eq("id", user.id).single(),
        supabase.from("club57_members").select("referred_by").eq("id", user.id).maybeSingle(),
        supabase
          .from("club57_points_ledger")
          .select("id, cantidad, tipo, estado, fecha_disponible, referencia, created_at")
          .eq("member_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("club57_redemption_catalog")
          .select("id, nombre, descripcion, costo_puntos, stock, image_url, clave, codigo")
          .eq("active", true)
          .order("costo_puntos", { ascending: true }),
        supabase
          .from("club57_redemptions")
          .select("id, puntos_usados, estado, created_at, club57_redemption_catalog(nombre)")
          .eq("member_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(
            "id, order_number, created_at, total, status, fulfillment_type, colonia, shipping_address, subtotal, shipping_cost"
          )
          .eq("customer_email", user.email ?? "")
          .order("created_at", { ascending: false }),
        supabase.from("club57_config").select("monto_por_punto, puntos_referido").maybeSingle(),
      ]);

    profile = profileResult.data;

    const ledgerRows = ledgerResult.data ?? [];
    historial = ledgerRows;
    saldoDisponible = ledgerRows
      .filter((row) => row.estado === "disponible")
      .reduce((sum, row) => sum + row.cantidad, 0);
    const pendientes = ledgerRows.filter((row) => row.estado === "pendiente");
    puntosPendientes = pendientes.reduce((sum, row) => sum + row.cantidad, 0);
    // La fecha más próxima entre los movimientos pendientes — la que le
    // importa al cliente es cuándo se libera el PRIMER lote, no el último.
    const fechasPendientes = pendientes
      .map((row) => row.fecha_disponible)
      .filter((fecha): fecha is string => Boolean(fecha))
      .sort();
    proximaFechaDisponible = fechasPendientes[0] ?? null;

    catalogo = catalogResult.data ?? [];
    montoPorPunto = configResult.data?.monto_por_punto ? Number(configResult.data.monto_por_punto) : 50;

    // El bono de referido (grant_club57_referral_bonus) se otorga hasta la
    // PRIMERA compra real del cliente, nunca al registrarse — este cálculo
    // no cambia esa lógica, solo decide si mostrar el aviso de "te falta
    // por ganar": vino con referred_by Y todavía no tiene un movimiento
    // 'referido_bono' propio en su historial.
    const yaTieneBonoReferido = ledgerRows.some((row) => row.tipo === "referido_bono");
    if (memberResult.data?.referred_by && !yaTieneBonoReferido) {
      bonoReferidoPendientePts = configResult.data?.puntos_referido
        ? Number(configResult.data.puntos_referido)
        : 10;
    }

    const orderRows = ordersResult.data ?? [];
    const orderIds = orderRows.map((order) => order.id);
    // Segunda consulta, no parte del Promise.all de arriba, porque
    // depende de los ids de pedidos que esa primera tanda todavía no
    // conoce — un solo "in (...)" para todos los pedidos del cliente en
    // vez de una consulta por pedido.
    const orderItemsData: (Club57OrderItemRow & { order_id: string })[] =
      orderIds.length > 0
        ? ((
            await supabase
              .from("order_items")
              .select("id, order_id, product_name, variant_label, sku, unit_price, quantity")
              .in("order_id", orderIds)
          ).data ?? [])
        : [];

    const itemsByOrderId = new Map<string, Club57OrderItemRow[]>();
    for (const item of orderItemsData ?? []) {
      const list = itemsByOrderId.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrderId.set(item.order_id, list);
    }
    pedidos = orderRows.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) ?? [],
    }));

    // La relación embebida llega como objeto o arreglo según cómo Supabase
    // resuelva el join — nunca se confía en una sola forma, un artículo
    // borrado (nunca pasa hoy por el "on delete restrict", pero por si
    // cambiara) cae al texto genérico en vez de romper el render.
    misCanjes = (redemptionsResult.data ?? []).map((row) => {
      const related = row.club57_redemption_catalog as { nombre: string } | { nombre: string }[] | null;
      const itemNombre = Array.isArray(related) ? related[0]?.nombre : related?.nombre;
      return {
        id: row.id,
        puntos_usados: row.puntos_usados,
        estado: row.estado,
        created_at: row.created_at,
        itemNombre: itemNombre ?? "Artículo",
      };
    });
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:py-24">
      {user ? (
        <>
          <ProfileView
            email={user.email ?? ""}
            fullName={profile?.full_name ?? null}
          />
          <Club57MemberPanel
            referralCode={profile?.referral_code ?? null}
            saldoDisponible={saldoDisponible}
            puntosPendientes={puntosPendientes}
            proximaFechaDisponible={proximaFechaDisponible}
            montoPorPunto={montoPorPunto}
            bonoReferidoPendientePts={bonoReferidoPendientePts}
            historial={historial}
            catalogo={catalogo}
            misCanjes={misCanjes}
            pedidos={pedidos}
          />
        </>
      ) : (
        <>
          <Image
            src="/brand/logo-naranja.png"
            alt="Ferretería 57"
            width={983}
            height={302}
            className="h-10 w-auto sm:h-12"
          />
          <div className="max-w-prose">
            <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
              Mi cuenta
            </h1>
            <p className="mt-3 font-sans text-sm text-brand-black sm:text-base">
              Al registrarte como cliente de Ferretería 57, ya formas parte
              del Programa de Lealtad — sin pasos adicionales.
            </p>
          </div>

          {searchParams.passwordReset === "1" && (
            <p role="status" className="w-full max-w-sm rounded-lg bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
              Tu contraseña se actualizó — ya puedes iniciar sesión con ella.
            </p>
          )}
          <AuthTabs />
        </>
      )}
    </main>
  );
}
