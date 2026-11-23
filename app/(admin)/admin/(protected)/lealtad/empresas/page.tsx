import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { EstadoEmpresaBadge } from "@/components/admin/empresas/EstadoEmpresaBadge";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_EMPRESA_LABEL, type EstadoEmpresa } from "@/lib/club57/empresas/datos";
import { normalizeText } from "@/lib/normalizeText";

export const metadata: Metadata = { title: "Empresas — Club 57 Empresarial" };

const ESTADOS: EstadoEmpresa[] = ["solicitud", "activa", "suspendida", "baja", "rechazada"];
const TABS: { value: "" | EstadoEmpresa; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "solicitud", label: "Solicitudes" },
  { value: "activa", label: "Activas" },
  { value: "suspendida", label: "Suspendidas" },
  { value: "baja", label: "Baja" },
  { value: "rechazada", label: "Rechazadas" },
];

interface EmpresaRow {
  id: string;
  nombre_comercial: string;
  razon_social: string;
  rfc: string | null;
  responsable_nombre: string;
  responsable_correo: string;
  limite_credito: number | string | null;
  estado: EstadoEmpresa;
  codigo: string | null;
  created_at: string;
}

const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const money = (n: number | string | null) =>
  n === null ? "—" : `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function hrefCon(estado: string, q: string) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/admin/lealtad/empresas${qs ? `?${qs}` : ""}`;
}

// Club 57 Empresarial — empresas con convenio y solicitudes de afiliación
// (admin y operador). Son decenas: se traen todas y se filtran aquí.
export default async function AdminEmpresasPage({ searchParams }: { searchParams: { estado?: string; q?: string } }) {
  const estado = ESTADOS.includes(searchParams.estado as EstadoEmpresa) ? (searchParams.estado as EstadoEmpresa) : "";
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club57_empresas")
    .select("id, nombre_comercial, razon_social, rfc, responsable_nombre, responsable_correo, limite_credito, estado, codigo, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const todas = (data ?? []) as EmpresaRow[];
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, todas.filter((row) => row.estado === e).length]));
  const needle = normalizeText(q);
  const visibles = todas.filter(
    (row) =>
      (!estado || row.estado === estado) &&
      (!needle ||
        [row.nombre_comercial, row.razon_social, row.rfc ?? "", row.responsable_nombre, row.responsable_correo, row.codigo ?? ""].some((v) =>
          normalizeText(v).includes(needle)
        ))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/lealtad" className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black">
          ← Club 57
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Empresas</h1>
            <p className="mt-1 font-sans text-sm text-brand-slate/70">
              Club 57 Empresarial: solicitudes de afiliación y empresas con convenio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/lealtad/empresas/cortes" className={buttonClassName("secondary")}>
              Cortes y facturación
            </Link>
            <Link href="/admin/lealtad/empresas/nueva" className={buttonClassName("primary")}>
              <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
              Nueva empresa
            </Link>
          </div>
        </div>
      </div>

      {conteo.solicitud > 0 && estado !== "solicitud" && (
        <Link
          href={hrefCon("solicitud", "")}
          className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-900 hover:bg-amber-100"
        >
          {conteo.solicitud === 1 ? "Hay 1 solicitud" : `Hay ${conteo.solicitud} solicitudes`} de afiliación por revisar.
        </Link>
      )}

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm">
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const activo = tab.value === estado;
            const n = tab.value ? conteo[tab.value] : todas.length;
            return (
              <Link
                key={tab.label}
                href={hrefCon(tab.value, q)}
                aria-current={activo ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-3 font-sans text-xs font-medium ${
                  activo ? "border-brand-slate bg-brand-slate text-white" : "border-brand-slate/30 text-brand-black hover:border-brand-slate"
                }`}
              >
                {tab.label} ({n})
              </Link>
            );
          })}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-3">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <div className="min-w-[220px] flex-1">
            <label htmlFor="q" className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
              Buscar por nombre, RFC, responsable o código
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              className="min-h-11 w-full rounded-md border border-brand-slate/30 px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
            />
          </div>
          <button type="submit" className={buttonClassName("secondary")}>
            Buscar
          </button>
        </form>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudieron cargar las empresas: {error.message}
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
          {todas.length === 0
            ? "Todavía no hay empresas. Las solicitudes del sitio aparecerán aquí."
            : `No hay empresas ${estado ? `en «${ESTADO_EMPRESA_LABEL[estado]}»` : ""} que coincidan con la búsqueda.`}
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">RFC</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3 text-right">Límite de crédito</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((row) => (
                <tr key={row.id} className="border-b border-brand-slate/10 last:border-0 hover:bg-brand-gray/40">
                  <td className="max-w-[260px] px-4 py-3">
                    <Link
                      href={`/admin/lealtad/empresas/${row.id}`}
                      className="font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                    >
                      {row.nombre_comercial}
                    </Link>
                    <p className="truncate text-xs text-brand-slate/70">{row.razon_social}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-slate">{row.rfc ?? "—"}</td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="text-brand-black">{row.responsable_nombre}</p>
                    <p className="truncate text-xs text-brand-slate/70">{row.responsable_correo}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-brand-black">{money(row.limite_credito)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-black">{row.codigo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <EstadoEmpresaBadge estado={row.estado} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-slate">{fecha.format(new Date(row.created_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
