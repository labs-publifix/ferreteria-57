import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { AuthTabs } from "@/components/account/AuthTabs";
import { ProfileView } from "@/components/account/ProfileView";
import {
  Club57MemberPanel,
  type Club57CatalogItem,
  type Club57LedgerRow,
  type Club57RedemptionRow,
} from "@/components/account/Club57MemberPanel";

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx.
export const metadata: Metadata = {
  title: "Mi cuenta — Ferretería 57",
  description:
    "Inicia sesión o crea tu cuenta de Ferretería 57. Al registrarte ya formas parte del Programa de Lealtad.",
};

// Server Component: decide qué mostrar (formulario o perfil) leyendo la
// sesión del lado del servidor con el cliente de lib/supabase/server.ts,
// para que la primera pintura ya llegue correcta (sin parpadeo mostrando
// primero el formulario y luego el perfil una vez resuelto el cliente).
export default async function CuentaPage() {
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
  let historial: Club57LedgerRow[] = [];
  let catalogo: Club57CatalogItem[] = [];
  let misCanjes: Club57RedemptionRow[] = [];

  if (user) {
    const [profileResult, ledgerResult, catalogResult, redemptionsResult] = await Promise.all([
      supabase.from("profiles").select("full_name, referral_code").eq("id", user.id).single(),
      supabase
        .from("club57_points_ledger")
        .select("id, cantidad, tipo, estado, referencia, created_at")
        .eq("member_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("club57_redemption_catalog")
        .select("id, nombre, descripcion, costo_puntos, stock, image_url")
        .eq("active", true)
        .order("costo_puntos", { ascending: true }),
      supabase
        .from("club57_redemptions")
        .select("id, puntos_usados, estado, created_at, club57_redemption_catalog(nombre)")
        .eq("member_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    profile = profileResult.data;

    const ledgerRows = ledgerResult.data ?? [];
    historial = ledgerRows;
    saldoDisponible = ledgerRows
      .filter((row) => row.estado === "disponible")
      .reduce((sum, row) => sum + row.cantidad, 0);
    puntosPendientes = ledgerRows
      .filter((row) => row.estado === "pendiente")
      .reduce((sum, row) => sum + row.cantidad, 0);

    catalogo = catalogResult.data ?? [];

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
      <Image
        src="/brand/logo-naranja.png"
        alt="Ferretería 57"
        width={983}
        height={302}
        className="h-10 w-auto sm:h-12"
      />

      {user ? (
        <>
          <ProfileView
            email={user.email ?? ""}
            fullName={profile?.full_name ?? null}
            referralCode={profile?.referral_code ?? null}
          />
          <Club57MemberPanel
            saldoDisponible={saldoDisponible}
            puntosPendientes={puntosPendientes}
            historial={historial}
            catalogo={catalogo}
            misCanjes={misCanjes}
          />
        </>
      ) : (
        <>
          <div className="max-w-prose">
            <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
              Mi cuenta
            </h1>
            <p className="mt-3 font-sans text-sm text-brand-black sm:text-base">
              Al registrarte como cliente de Ferretería 57, ya formas parte
              del Programa de Lealtad — sin pasos adicionales.
            </p>
          </div>

          <AuthTabs />
        </>
      )}
    </main>
  );
}
