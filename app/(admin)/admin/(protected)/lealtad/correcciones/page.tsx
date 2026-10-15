import type { Metadata } from "next";
import Link from "next/link";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addDaysInStoreTimezone } from "@/lib/marketing/visibility";
import { CLUB57_MOTIVOS, club57MotivoTexto } from "@/lib/club57/correcciones";

export const metadata: Metadata = { title: "Bitácora de correcciones — Club 57" };

const PAGE_SIZE = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const timeFormatter = new Intl.DateTimeFormat("es-MX", { timeStyle: "short", timeZone: "America/Mexico_City" });
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const pesosFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const fieldClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

interface CorreccionRow {
  id: string;
  member_id: string;
  accion: "cancelada" | "corregida";
  motivo: string;
  motivo_nota: string | null;
  fuera_de_politica: boolean;
  justificacion: string | null;
  puntos_anulados: number;
  puntos_nuevos: number | null;
  monto_anterior: number | null;
  monto_nuevo: number | null;
  producto_anterior: string | null;
  producto_nuevo: string | null;
  fecha_compra: string;
  dias_transcurridos: number;
  actor_id: string | null;
  actor_rol: "admin" | "vendedor";
  created_at: string;
  club57_members: { full_name: string } | { full_name: string }[] | null;
}

interface Filtros {
  desde: string;
  hasta: string;
  motivo: string;
  accion: string;
  quien: string;
  politica: string;
  page: number;
}

function leerFiltros(searchParams: Record<string, string | undefined>): Filtros {
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  return {
    desde: DATE_RE.test(searchParams.desde ?? "") ? searchParams.desde! : "",
    hasta: DATE_RE.test(searchParams.hasta ?? "") ? searchParams.hasta! : "",
    motivo: CLUB57_MOTIVOS.some((m) => m.value === searchParams.motivo) ? searchParams.motivo! : "",
    accion: searchParams.accion === "cancelada" || searchParams.accion === "corregida" ? searchParams.accion : "",
    quien: UUID_RE.test(searchParams.quien ?? "") ? searchParams.quien! : "",
    politica: searchParams.politica === "fuera" ? "fuera" : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Personal que puede aparecer como autor: admins y vendedores (los admins
// leen todos los perfiles, ver 20260914010000).
async function getPersonal(): Promise<{ id: string; nombre: string; rol: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "vendedor"]);
  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      nombre: (row.full_name as string | null)?.trim() || "Sin nombre",
      rol: row.role as string,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

async function getCorrecciones(filtros: Filtros) {
  const supabase = await createClient();
  let query = supabase
    .from("club57_correcciones")
    .select(
      "id, member_id, accion, motivo, motivo_nota, fuera_de_politica, justificacion, puntos_anulados, puntos_nuevos, monto_anterior, monto_nuevo, producto_anterior, producto_nuevo, fecha_compra, dias_transcurridos, actor_id, actor_rol, created_at, club57_members(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Fechas de calendario en Querétaro (UTC-6 todo el año desde 2022).
  if (filtros.desde) query = query.gte("created_at", `${filtros.desde}T00:00:00-06:00`);
  if (filtros.hasta) query = query.lt("created_at", `${addDaysInStoreTimezone(1, filtros.hasta)}T00:00:00-06:00`);
  if (filtros.motivo) query = query.eq("motivo", filtros.motivo);
  if (filtros.accion) query = query.eq("accion", filtros.accion);
  if (filtros.quien) query = query.eq("actor_id", filtros.quien);
  if (filtros.politica === "fuera") query = query.eq("fuera_de_politica", true);

  const from = (filtros.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as CorreccionRow[], total: count ?? 0, error: error?.message };
}

function hrefConPagina(filtros: Filtros, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["desde", "hasta", "motivo", "accion", "quien", "politica"] as const) {
    if (filtros[key]) params.set(key, filtros[key]);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/lealtad/correcciones${qs ? `?${qs}` : ""}`;
}

function formatMonto(value: number | null): string {
  return value === null ? "—" : pesosFormatter.format(Number(value));
}

// Bitácora de compras de Club 57 canceladas o corregidas: quién, cuándo,
// por qué y si fue dentro o fuera de la política de 7 días. Solo admin (la
// tabla solo es legible para is_admin(), ver 20261015010000).
export default async function AdminClub57CorreccionesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filtros = leerFiltros(searchParams);
  const [personal, { rows, total, error }] = await Promise.all([getPersonal(), getCorrecciones(filtros)]);
  const nombrePorId = new Map(personal.map((p) => [p.id, p.nombre]));
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Boolean(
    filtros.desde || filtros.hasta || filtros.motivo || filtros.accion || filtros.quien || filtros.politica
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Club 57
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Bitácora de correcciones</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Compras en tienda canceladas o corregidas. Lo marcado como «Fuera de política» y su justificación solo lo
          ve el personal.
        </p>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="desde" className={labelClass}>
            Desde
          </label>
          <input id="desde" name="desde" type="date" defaultValue={filtros.desde} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="hasta" className={labelClass}>
            Hasta
          </label>
          <input id="hasta" name="hasta" type="date" defaultValue={filtros.hasta} className={fieldClass} />
        </div>
        <div>
          <span className={labelClass}>Motivo</span>
          <FilterSelectField
            name="motivo"
            defaultValue={filtros.motivo}
            label="Motivo"
            options={[{ value: "", label: "Todos" }, ...CLUB57_MOTIVOS.map((m) => ({ value: m.value, label: m.label }))]}
          />
        </div>
        <div>
          <span className={labelClass}>Acción</span>
          <FilterSelectField
            name="accion"
            defaultValue={filtros.accion}
            label="Acción"
            options={[
              { value: "", label: "Todas" },
              { value: "cancelada", label: "Cancelada" },
              { value: "corregida", label: "Corregida" },
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>Quién</span>
          <FilterSelectField
            name="quien"
            defaultValue={filtros.quien}
            label="Quién"
            options={[
              { value: "", label: "Todo el personal" },
              ...personal.map((p) => ({
                value: p.id,
                label: `${p.nombre} (${p.rol === "admin" ? "admin" : "vendedor"})`,
              })),
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>Política</span>
          <FilterSelectField
            name="politica"
            defaultValue={filtros.politica}
            label="Política"
            options={[
              { value: "", label: "Todas" },
              { value: "fuera", label: "Solo fuera de política" },
            ]}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className={buttonClassName("secondary")}>
            Filtrar
          </button>
          {hayFiltros && (
            <Link
              href="/admin/lealtad/correcciones"
              className="px-2 py-2.5 font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
            >
              Quitar filtros
            </Link>
          )}
        </div>
      </form>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          No se pudo cargar la bitácora: {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/70 shadow-sm">
          {hayFiltros ? "No hay correcciones con esos filtros." : "Todavía no hay compras canceladas ni corregidas."}
        </p>
      ) : (
        <>
          <p className="font-sans text-sm text-brand-slate/70">
            {total} {total === 1 ? "registro" : "registros"}
          </p>
          <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full min-w-[980px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Puntos</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Quién</th>
                  <th className="px-4 py-3">Política</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const member = Array.isArray(row.club57_members) ? row.club57_members[0] : row.club57_members;
                  return (
                    <tr key={row.id} className="border-b border-brand-slate/10 align-top last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-brand-slate">
                        {dateFormatter.format(new Date(row.created_at))}
                        <span className="block text-xs text-brand-slate/70">
                          {timeFormatter.format(new Date(row.created_at))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/lealtad/clientes/${row.member_id}`}
                          className="font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
                        >
                          {member?.full_name ?? "Cliente"}
                        </Link>
                        <span className="block text-xs text-brand-slate/70">
                          Compra del {dateFormatter.format(new Date(row.fecha_compra))}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-brand-black">
                        {row.accion === "cancelada" ? "Cancelada" : "Corregida"}
                        <span className="block text-xs text-brand-slate/70">
                          {row.producto_anterior ?? "—"}
                          {row.producto_nuevo && row.producto_nuevo !== row.producto_anterior && (
                            <> → {row.producto_nuevo}</>
                          )}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-brand-black">
                        {club57MotivoTexto(row.motivo, row.motivo_nota)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-black">
                        {row.accion === "cancelada" ? (
                          <span className="text-red-700">−{row.puntos_anulados}</span>
                        ) : (
                          <>
                            {row.puntos_anulados} → {row.puntos_nuevos}
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-slate">
                        {formatMonto(row.monto_anterior)}
                        {row.accion === "corregida" && <> → {formatMonto(row.monto_nuevo)}</>}
                      </td>
                      <td className="px-4 py-3 text-brand-black">
                        {(row.actor_id && nombrePorId.get(row.actor_id)) || "—"}
                        <span className="block text-xs text-brand-slate/70">
                          {row.actor_rol === "admin" ? "Admin" : "Vendedor"}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        {row.fuera_de_politica ? (
                          <>
                            <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              Fuera de política · {row.dias_transcurridos} días
                            </span>
                            {row.justificacion && (
                              <span className="mt-1.5 block text-xs text-brand-slate">{row.justificacion}</span>
                            )}
                          </>
                        ) : (
                          <span className="whitespace-nowrap text-xs text-brand-slate/70">
                            Dentro del plazo · {row.dias_transcurridos} {row.dias_transcurridos === 1 ? "día" : "días"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <nav aria-label="Paginación de la bitácora" className="flex items-center justify-between gap-3">
              {filtros.page > 1 ? (
                <Link href={hrefConPagina(filtros, filtros.page - 1)} className={buttonClassName("secondary")}>
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="font-sans text-sm text-brand-slate/70">
                Página {filtros.page} de {totalPaginas}
              </span>
              {filtros.page < totalPaginas ? (
                <Link href={hrefConPagina(filtros, filtros.page + 1)} className={buttonClassName("secondary")}>
                  Siguiente
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
