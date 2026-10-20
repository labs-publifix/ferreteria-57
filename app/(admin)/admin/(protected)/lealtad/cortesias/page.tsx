import type { Metadata } from "next";
import Link from "next/link";
import { FilterSelectField } from "@/components/admin/FilterSelectField";
import { buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { addDaysInStoreTimezone } from "@/lib/marketing/visibility";
import {
  CLUB57_MOTIVOS_ANULACION_CORTESIA,
  CLUB57_MOTIVOS_CORTESIA,
  club57MotivoCortesiaTexto,
} from "@/lib/club57/cortesias";

export const metadata: Metadata = { title: "Bitácora de puntos de cortesía — Club 57" };

const PAGE_SIZE = 50;
const ROL_LABEL: Record<string, string> = { admin: "Admin", operador: "Operador" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Motivos de otorgamiento y de anulación, sin repetir «Otro».
const MOTIVOS_FILTRO = [
  ...CLUB57_MOTIVOS_CORTESIA,
  ...CLUB57_MOTIVOS_ANULACION_CORTESIA.filter((m) => m.value !== "otro"),
];

const timeFormatter = new Intl.DateTimeFormat("es-MX", { timeStyle: "short", timeZone: "America/Mexico_City" });
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });

const fieldClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

interface CortesiaRow {
  id: string;
  member_id: string;
  accion: "otorgada" | "anulada";
  cortesia_id: string;
  puntos: number;
  motivo: string;
  motivo_nota: string | null;
  actor_id: string | null;
  actor_rol: "admin" | "operador";
  created_at: string;
  club57_members: { full_name: string } | { full_name: string }[] | null;
}

interface Filtros {
  desde: string;
  hasta: string;
  motivo: string;
  accion: string;
  quien: string;
  page: number;
}

function leerFiltros(searchParams: Record<string, string | undefined>): Filtros {
  const page = Number.parseInt(searchParams.page ?? "1", 10);
  return {
    desde: DATE_RE.test(searchParams.desde ?? "") ? searchParams.desde! : "",
    hasta: DATE_RE.test(searchParams.hasta ?? "") ? searchParams.hasta! : "",
    motivo: MOTIVOS_FILTRO.some((m) => m.value === searchParams.motivo) ? searchParams.motivo! : "",
    accion: searchParams.accion === "otorgada" || searchParams.accion === "anulada" ? searchParams.accion : "",
    quien: UUID_RE.test(searchParams.quien ?? "") ? searchParams.quien! : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Quién puede aparecer como autor: admin y operador (solo ellos otorgan).
async function getPersonal(): Promise<{ id: string; nombre: string; rol: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "operador"]);
  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      nombre: (row.full_name as string | null)?.trim() || "Sin nombre",
      rol: row.role as string,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

async function getCortesias(filtros: Filtros) {
  const supabase = await createClient();
  let query = supabase
    .from("club57_cortesias")
    .select(
      "id, member_id, accion, cortesia_id, puntos, motivo, motivo_nota, actor_id, actor_rol, created_at, club57_members(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Fechas de calendario en Querétaro (UTC-6 todo el año desde 2022).
  if (filtros.desde) query = query.gte("created_at", `${filtros.desde}T00:00:00-06:00`);
  if (filtros.hasta) query = query.lt("created_at", `${addDaysInStoreTimezone(1, filtros.hasta)}T00:00:00-06:00`);
  if (filtros.motivo) query = query.eq("motivo", filtros.motivo);
  if (filtros.accion) query = query.eq("accion", filtros.accion);
  if (filtros.quien) query = query.eq("actor_id", filtros.quien);

  const from = (filtros.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as CortesiaRow[];

  // Otorgamientos de esta página que ya fueron anulados (aunque la
  // anulación no esté en la página o quede fuera del filtro).
  const otorgadas = rows.filter((row) => row.accion === "otorgada").map((row) => row.cortesia_id);
  let anuladas = new Set<string>();
  if (otorgadas.length > 0) {
    const { data: anulaciones } = await supabase
      .from("club57_cortesias")
      .select("cortesia_id")
      .eq("accion", "anulada")
      .in("cortesia_id", otorgadas);
    anuladas = new Set((anulaciones ?? []).map((row) => row.cortesia_id as string));
  }

  return { rows, anuladas, total: count ?? 0, error: error?.message };
}

function hrefConPagina(filtros: Filtros, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["desde", "hasta", "motivo", "accion", "quien"] as const) {
    if (filtros[key]) params.set(key, filtros[key]);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/lealtad/cortesias${qs ? `?${qs}` : ""}`;
}

// Bitácora de puntos de cortesía de Club 57: cada otorgamiento y cada
// anulación, con quién, cuándo, a quién y por qué. Admin y operador (la
// tabla solo es legible para is_admin(), ver 20261020010000).
export default async function AdminClub57CortesiasPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const filtros = leerFiltros(searchParams);
  const [personal, { rows, anuladas, total, error }] = await Promise.all([getPersonal(), getCortesias(filtros)]);
  const nombrePorId = new Map(personal.map((p) => [p.id, p.nombre]));
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Boolean(filtros.desde || filtros.hasta || filtros.motivo || filtros.accion || filtros.quien);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/lealtad"
          className="font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          ← Club 57
        </Link>
        <h1 className="mt-2 font-display text-xl uppercase text-brand-slate sm:text-2xl">Puntos de cortesía</h1>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/70">
          Puntos otorgados desde el detalle de cada cliente y sus anulaciones. La nota interna solo la ve el personal;
          el cliente ve el motivo.
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
            options={[{ value: "", label: "Todos" }, ...MOTIVOS_FILTRO.map((m) => ({ value: m.value, label: m.label }))]}
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
              { value: "otorgada", label: "Otorgada" },
              { value: "anulada", label: "Anulada" },
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
              ...personal.map((p) => ({ value: p.id, label: `${p.nombre} (${ROL_LABEL[p.rol] ?? p.rol})` })),
            ]}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className={buttonClassName("secondary")}>
            Filtrar
          </button>
          {hayFiltros && (
            <Link
              href="/admin/lealtad/cortesias"
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
          {hayFiltros
            ? "No hay movimientos con esos filtros."
            : "Todavía no se han otorgado puntos de cortesía. Se otorgan desde el detalle de cada cliente."}
        </p>
      ) : (
        <>
          <p className="font-sans text-sm text-brand-slate/70">
            {total} {total === 1 ? "registro" : "registros"}
          </p>
          <div className="relative min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Puntos</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Quién</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const member = Array.isArray(row.club57_members) ? row.club57_members[0] : row.club57_members;
                  const motivo = club57MotivoCortesiaTexto(row.motivo);
                  const nota = row.motivo_nota?.trim();
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
                      </td>
                      <td className="px-4 py-3 text-brand-black">
                        {row.accion === "otorgada" ? "Otorgada" : "Anulada"}
                        {row.accion === "otorgada" && anuladas.has(row.cortesia_id) && (
                          <span className="mt-1 block">
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              Anulada después
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {row.accion === "otorgada" ? (
                          <span className="text-brand-black">+{row.puntos}</span>
                        ) : (
                          <span className="text-red-700">−{row.puntos}</span>
                        )}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-brand-black">
                        {row.motivo === "otro" ? "Otro" : motivo}
                        {nota && <span className="mt-0.5 block text-xs text-brand-slate">Nota: {nota}</span>}
                      </td>
                      <td className="px-4 py-3 text-brand-black">
                        {(row.actor_id && nombrePorId.get(row.actor_id)) || "—"}
                        <span className="block text-xs text-brand-slate/70">
                          {ROL_LABEL[row.actor_rol] ?? row.actor_rol}
                        </span>
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
