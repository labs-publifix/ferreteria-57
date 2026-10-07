// Lecturas del panel para el aviso por email (service role: quien llama ya
// verificó que es admin).
import { createAvisosDb } from "@/lib/club57/avisos/db";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import { AVISOS_UMBRAL_MENSUAL, getAvisosConfig } from "./config";
import { diaNegocio, simularCola, type CampanaEnCola } from "./estimacion";
import type { AvisoCampanaResumen, AvisoCapacidad, AvisoEstado, AvisosListaData } from "./tipos";

type Db = ReturnType<typeof createAvisosDb>;

interface CampanaRow {
  id: string;
  promocion_id: string;
  estado: AvisoEstado;
  alcance: "todos" | "no_recibieron";
  total: number;
  enviados: number;
  fallidos: number;
  omitidos: number;
  programado_para: string;
  finalizada_at: string | null;
  pausa_motivo: "limite_diario" | "limite_mensual" | null;
  created_at: string;
  club57_promociones: { vigencia_inicio: string; vigencia_fin: string } | null;
}

const CAMPANA_COLS =
  "id, promocion_id, estado, alcance, total, enviados, fallidos, omitidos, programado_para, finalizada_at, pausa_motivo, created_at, club57_promociones(vigencia_inicio, vigencia_fin)";

function pendientesDe(row: CampanaRow): number {
  return Math.max(0, row.total - row.enviados - row.fallidos - row.omitidos);
}

export async function loadCapacidad(db: Db, pendientesExtra = 0): Promise<AvisoCapacidad & { pendientesActivos: number }> {
  const cfg = getAvisosConfig();
  const [{ data: uso }, { data: activas }] = await Promise.all([
    db.rpc("club57_email_uso"),
    db.from("club57_email_campanas").select("total, enviados, fallidos, omitidos").in("estado", ["programada", "en_proceso"]),
  ]);
  const fila = (uso as { hoy: number; mes: number }[] | null)?.[0];
  const usadosHoy = Number(fila?.hoy ?? 0);
  const usadosMes = Number(fila?.mes ?? 0);
  const pendientesActivos = ((activas ?? []) as Pick<CampanaRow, "total" | "enviados" | "fallidos" | "omitidos">[]).reduce(
    (sum, row) => sum + Math.max(0, row.total - row.enviados - row.fallidos - row.omitidos),
    0
  );
  return {
    capDiario: cfg.promoDailyCap,
    usadosHoy,
    restantesHoy: Math.max(0, cfg.promoDailyCap - usadosHoy),
    cercaLimiteMensual: usadosMes + pendientesActivos + pendientesExtra >= cfg.monthlyLimit * AVISOS_UMBRAL_MENSUAL,
    pendientesActivos,
  };
}

function aCola(rows: CampanaRow[]): CampanaEnCola[] {
  return rows
    .filter((row) => row.club57_promociones && (row.estado === "programada" || row.estado === "en_proceso"))
    .map((row) => {
      const promo = row.club57_promociones!;
      const dia = diaNegocio(row.programado_para);
      return {
        id: row.id,
        inicioDia: dia > promo.vigencia_inicio ? dia : promo.vigencia_inicio,
        orden: new Date(row.programado_para).getTime(),
        pendientes: pendientesDe(row),
        finVigencia: promo.vigencia_fin,
      };
    });
}

export async function loadColaActiva(db: Db): Promise<CampanaEnCola[]> {
  const { data } = await db
    .from("club57_email_campanas")
    .select(CAMPANA_COLS)
    .in("estado", ["programada", "en_proceso"]);
  return aCola((data ?? []) as unknown as CampanaRow[]);
}

async function resumir(db: Db, rows: CampanaRow[], capacidad: AvisoCapacidad): Promise<AvisoCampanaResumen[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [porCampana, cola] = await Promise.all([
    Promise.all(
      ids.map(async (id) => {
        const [vencidas, ultimo] = await Promise.all([
          db
            .from("club57_email_envios")
            .select("id", { count: "exact", head: true })
            .eq("campana_id", id)
            .eq("estado", "omitido")
            .eq("motivo", "vencida"),
          db
            .from("club57_email_envios")
            .select("enviado_en")
            .eq("campana_id", id)
            .eq("estado", "enviado")
            .order("enviado_en", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        return [id, { vencidas: vencidas.count ?? 0, ultimo: (ultimo.data?.enviado_en as string | undefined) ?? null }] as const;
      })
    ),
    loadColaActiva(db),
  ]);
  const vencidasPor = new Map(porCampana.map(([id, v]) => [id, v.vencidas]));
  const ultimoPor = new Map(porCampana.filter(([, v]) => v.ultimo).map(([id, v]) => [id, v.ultimo as string]));

  const simulacion = simularCola({
    hoy: todayInStoreTimezone(),
    restantesHoy: capacidad.restantesHoy,
    capDiario: capacidad.capDiario,
    campanas: cola,
  });

  return rows.map((row) => {
    const est = simulacion.get(row.id);
    return {
      id: row.id,
      estado: row.estado,
      alcance: row.alcance,
      total: row.total,
      enviados: row.enviados,
      fallidos: row.fallidos,
      omitidos: row.omitidos,
      omitidosVencida: vencidasPor.get(row.id) ?? 0,
      pendientes: pendientesDe(row),
      programadoPara: row.programado_para,
      finalizadaAt: row.finalizada_at,
      pausaMotivo: row.pausa_motivo,
      createdAt: row.created_at,
      ultimoEnvio: ultimoPor.get(row.id) ?? null,
      fechaFinEstimada: est?.fechaFin ?? null,
      noAlcanzan: est?.noAlcanzan ?? 0,
    };
  });
}

export async function loadCampanasDePromo(db: Db, promocionId: string, capacidad: AvisoCapacidad) {
  const { data } = await db
    .from("club57_email_campanas")
    .select(CAMPANA_COLS)
    .eq("promocion_id", promocionId)
    .order("created_at", { ascending: false })
    .limit(20);
  return resumir(db, (data ?? []) as unknown as CampanaRow[], capacidad);
}

// Para la lista del panel: el último aviso de cada promoción + métrica de
// descargas de quienes lo recibieron.
export async function loadAvisosLista(promocionIds: string[]): Promise<AvisosListaData> {
  const db = createAvisosDb();
  const capacidad = await loadCapacidad(db);
  const porPromo: AvisosListaData["porPromo"] = {};
  if (promocionIds.length === 0) return { capacidad, porPromo };

  const [{ data: campanas }, { data: metricas }] = await Promise.all([
    db
      .from("club57_email_campanas")
      .select(CAMPANA_COLS)
      .in("promocion_id", promocionIds)
      .order("created_at", { ascending: false }),
    db.rpc("club57_email_metricas"),
  ]);

  const ultimaPor = new Map<string, CampanaRow>();
  for (const row of (campanas ?? []) as unknown as CampanaRow[]) {
    if (!ultimaPor.has(row.promocion_id)) ultimaPor.set(row.promocion_id, row);
  }
  const resumenes = await resumir(db, [...ultimaPor.values()], capacidad);
  const resumenPor = new Map(resumenes.map((r) => [r.id, r]));

  const metricasPor = new Map<string, { enviados: number; descargaron: number; ultimoEnvio: string | null }>();
  for (const row of (metricas ?? []) as {
    promocion_id: string;
    enviados: number;
    descargaron: number;
    ultimo_envio: string | null;
  }[]) {
    metricasPor.set(row.promocion_id, {
      enviados: Number(row.enviados),
      descargaron: Number(row.descargaron),
      ultimoEnvio: row.ultimo_envio,
    });
  }

  for (const id of promocionIds) {
    const ultima = ultimaPor.get(id);
    porPromo[id] = {
      ultima: ultima ? resumenPor.get(ultima.id) ?? null : null,
      metricas: metricasPor.get(id) ?? null,
    };
  }
  return { capacidad, porPromo };
}

// Métrica ligera para las tarjetas del índice de Promociones.
export async function loadMetricasAvisos(): Promise<
  Map<string, { enviados: number; descargaron: number; ultimoEnvio: string | null }>
> {
  const db = createAvisosDb();
  const { data } = await db.rpc("club57_email_metricas");
  const map = new Map<string, { enviados: number; descargaron: number; ultimoEnvio: string | null }>();
  for (const row of (data ?? []) as { promocion_id: string; enviados: number; descargaron: number; ultimo_envio: string | null }[]) {
    map.set(row.promocion_id, { enviados: Number(row.enviados), descargaron: Number(row.descargaron), ultimoEnvio: row.ultimo_envio });
  }
  return map;
}
