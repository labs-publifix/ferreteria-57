import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Club57PartnerForm } from "@/components/admin/Club57PartnerForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar socio comercial — Club 57" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

export default async function EditarSocioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { guardado?: string; logo_error?: string; avisos?: string };
}) {
  if (!UUID_RE.test(params.id)) notFound();
  const supabase = await createClient();
  const [{ data: socio }, { data: giros }] = await Promise.all([
    supabase.from("club57_partners").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("club57_partner_giros").select("id, nombre, activo").order("nombre"),
  ]);
  if (!socio) notFound();

  const text = (value: unknown) => (typeof value === "string" ? value : "");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad/socios"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Directorio de socios
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">{socio.nombre_comercial}</h1>
        <p className="mt-1 font-sans text-sm text-brand-slate/70">
          {socio.origen === "carga_masiva" ? "Carga masiva" : "Alta manual"}
          {socio.clave_origen ? ` · Clave ${socio.clave_origen}` : ""} · Actualizado el{" "}
          {dateFormatter.format(new Date(socio.updated_at as string))}
          {socio.eliminado_at ? " · En «Eliminados»" : socio.activo ? "" : " · Inactivo"}
        </p>
      </div>

      {searchParams.guardado && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {searchParams.guardado === "nuevo" ? "Socio dado de alta." : "Cambios guardados."}
          {searchParams.avisos ? " Revisa los datos marcados como incompletos." : ""}
        </p>
      )}
      {searchParams.logo_error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          El socio se guardó, pero el logotipo no: {searchParams.logo_error.slice(0, 200)}
        </p>
      )}
      {!socio.giro_id && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 font-sans text-sm text-amber-900">
          Pendiente de completar: asígnale un giro para que se publique en el directorio.
        </p>
      )}

      <Club57PartnerForm
        key={socio.updated_at as string}
        id={socio.id as string}
        giros={(giros ?? []) as { id: string; nombre: string; activo: boolean }[]}
        logoUrl={(socio.logo_url as string | null) ?? null}
        consentimientoFecha={(socio.consentimiento_fecha as string | null) ?? null}
        initial={{
          nombre_comercial: text(socio.nombre_comercial),
          giro_id: text(socio.giro_id),
          contacto: text(socio.contacto),
          telefono: text(socio.telefono),
          correo: text(socio.correo),
          correo_2: text(socio.correo_2),
          calle: text(socio.calle),
          num_ext: text(socio.num_ext),
          num_int: text(socio.num_int),
          colonia: text(socio.colonia),
          cp: text(socio.cp),
          municipio: text(socio.municipio),
          estado: text(socio.estado) || "Querétaro",
          notas: text(socio.notas_internas),
          consentimiento: Boolean(socio.consentimiento_datos),
        }}
      />
    </div>
  );
}
