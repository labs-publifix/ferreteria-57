// Motor de envío de avisos por lotes. Lo llaman el cron diario y el
// "Enviar ahora" del panel; ambos pasan por el mismo candado global, así
// que nunca corren dos a la vez (ni rebasan el límite ni duplican).
//
// Reglas:
//   * Capacidad del día = RESEND_DAILY_LIMIT - RESEND_TRANSACTIONAL_RESERVE,
//     menos lo que ya salió hoy (avisos + pruebas, día de negocio CDMX).
//   * Además, el proveedor informa en cada respuesta cuánto lleva usado la
//     cuenta completa (incluye los transaccionales de pedidos y canjes): con
//     eso se recorta la capacidad para que la reserva siempre quede libre.
//     El primer lote de cada corrida es de 1 correo para leer ese dato antes
//     de mandar el resto.
//   * Si el proveedor responde que se llegó al límite del día (o del mes),
//     se detiene sin marcar fallidos: el lote se libera y sale mañana.
//   * Un lote enviado pero no marcado (corte a media corrida) se reenvía con
//     la MISMA llave de idempotencia: el proveedor no lo duplica.
//   * Lo que no salió antes de terminar la vigencia se marca omitido.
import { randomUUID } from "node:crypto";
import { createAvisosDb } from "@/lib/club57/avisos/db";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import type { PromoTipo } from "@/lib/club57/promociones/config";
import { getAvisosBaseUrl, getAvisosConfig } from "./config";
import { avisoBajaOneClickUrl, avisoBajaUrl, buildAvisoEmail } from "./plantillas";
import { enviarLote, type AvisoMensaje } from "./sender";
import { firmarBaja } from "./token";

export type MotivoDetencion = "limite_diario" | "limite_mensual" | "tiempo" | "error_temporal";

export interface CorridaResultado {
  estado: "desactivado" | "ocupado" | "ok";
  enviados: number;
  fallidos: number;
  detenidoPor: MotivoDetencion | null;
}

type Db = ReturnType<typeof createAvisosDb>;

interface CampanaCola {
  id: string;
  estado: "programada" | "en_proceso";
  tipo: PromoTipo;
  club57_promociones: { estado: string; vigencia_inicio: string; vigencia_fin: string } | null;
}

interface FilaLote {
  lote_id: string;
  lote_creado: string;
  envio_id: string;
  member_id: string;
  email: string;
  nombre: string | null;
  puntos: number | null;
}

const PAUSA_ENTRE_SOLICITUDES_MS = 550; // ~2 solicitudes por segundo
const LOTE_VIEJO_MS = 23 * 60 * 60 * 1000; // la idempotencia dura 24 h
const MARGEN_FINAL_MS = 4000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function omitirPendientes(db: Db, campanaId: string, motivo: string) {
  await db
    .from("club57_email_envios")
    .update({ estado: "omitido", motivo, updated_at: new Date().toISOString() })
    .eq("campana_id", campanaId)
    .eq("estado", "pendiente");
}

async function pausar(db: Db, campanaId: string, motivo: "limite_diario" | "limite_mensual") {
  await db
    .from("club57_email_campanas")
    .update({ pausa_motivo: motivo, pausa_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", campanaId);
}

async function liberarLote(db: Db, loteId: string) {
  await db.from("club57_email_envios").update({ lote_id: null }).eq("lote_id", loteId).eq("estado", "pendiente");
  await db.from("club57_email_lotes").update({ cerrado_at: new Date().toISOString() }).eq("id", loteId);
}

export async function procesarAvisos({ presupuestoMs }: { presupuestoMs: number }): Promise<CorridaResultado> {
  const cfg = getAvisosConfig();
  const resultado: CorridaResultado = { estado: "ok", enviados: 0, fallidos: 0, detenidoPor: null };
  if (!cfg.enabled) return { ...resultado, estado: "desactivado" };

  const db = createAvisosDb();
  const holder = randomUUID();
  const { data: tomado } = await db.rpc("club57_email_lock_tomar", {
    p_holder: holder,
    p_segundos: Math.ceil(presupuestoMs / 1000) + 60,
  });
  if (tomado !== true) return { ...resultado, estado: "ocupado" };

  try {
    const limite = Date.now() + presupuestoMs;
    const { data: uso } = await db.rpc("club57_email_uso");
    const usadosHoy = Number((uso as { hoy: number }[] | null)?.[0]?.hoy ?? 0);
    let presupuesto = cfg.promoDailyCap - usadosHoy;
    let proveedorConocido = false;

    const hoy = todayInStoreTimezone();
    const baseUrl = getAvisosBaseUrl();

    const { data: campanas, error } = await db
      .from("club57_email_campanas")
      .select("id, estado, tipo, club57_promociones(estado, vigencia_inicio, vigencia_fin)")
      .in("estado", ["programada", "en_proceso"])
      .lte("programado_para", new Date().toISOString())
      .order("programado_para", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    cola: for (const campana of (campanas ?? []) as unknown as CampanaCola[]) {
      const promo = campana.club57_promociones;
      if (!promo || promo.estado !== "publicada") {
        await omitirPendientes(db, campana.id, "archivada");
        await db.rpc("club57_email_campana_finalizar", { p_campana: campana.id });
        continue;
      }
      if (hoy > promo.vigencia_fin) {
        await omitirPendientes(db, campana.id, "vencida");
        await db.rpc("club57_email_campana_finalizar", { p_campana: campana.id });
        continue;
      }
      if (hoy < promo.vigencia_inicio) continue;

      await db
        .from("club57_email_campanas")
        .update({
          estado: "en_proceso",
          pausa_motivo: null,
          pausa_at: null,
          updated_at: new Date().toISOString(),
          ...(campana.estado === "programada" ? { iniciada_at: new Date().toISOString() } : {}),
        })
        .eq("id", campana.id);

      const rango = { inicio: promo.vigencia_inicio, fin: promo.vigencia_fin };

      for (;;) {
        if (Date.now() > limite - MARGEN_FINAL_MS) {
          resultado.detenidoPor = "tiempo";
          break cola;
        }
        if (presupuesto <= 0) {
          await pausar(db, campana.id, "limite_diario");
          resultado.detenidoPor = "limite_diario";
          break cola;
        }

        const tamano = Math.min(cfg.batchSize, presupuesto, proveedorConocido ? cfg.batchSize : 1);
        const { data: lote, error: loteError } = await db.rpc("club57_email_lote_tomar", {
          p_campana: campana.id,
          p_max: tamano,
        });
        if (loteError) throw new Error(loteError.message);
        const filas = (lote ?? []) as FilaLote[];
        if (filas.length === 0) {
          await db.rpc("club57_email_campana_finalizar", { p_campana: campana.id });
          break;
        }

        const loteId = filas[0].lote_id;
        if (Date.now() - new Date(filas[0].lote_creado).getTime() > LOTE_VIEJO_MS) {
          // Quedó abierto más tiempo del que el proveedor recuerda la llave:
          // no se reenvía a ciegas, se marca para que el equipo decida.
          await db.rpc("club57_email_lote_marcar", {
            p_lote: loteId,
            p_resultados: filas.map((f) => ({ id: f.envio_id, resend_id: null, error: "Envío interrumpido sin confirmación" })),
          });
          await db.rpc("club57_email_campana_recalcular", { p_campana: campana.id });
          continue;
        }

        const mensajes: AvisoMensaje[] = filas.map((fila) => {
          const token = firmarBaja(fila.member_id);
          const correo = buildAvisoEmail({
            tipo: campana.tipo,
            nombre: fila.nombre,
            puntos: fila.puntos,
            rango,
            hoy,
            baseUrl,
            bajaUrl: avisoBajaUrl(baseUrl, fila.member_id, token),
          });
          return {
            to: fila.email,
            ...correo,
            bajaOneClickUrl: avisoBajaOneClickUrl(baseUrl, fila.member_id, token),
            tipo: campana.tipo,
          };
        });

        const r = await enviarLote(mensajes, `club57-aviso-${loteId}`);

        if (r.kind === "ok") {
          await db.rpc("club57_email_lote_marcar", {
            p_lote: loteId,
            p_resultados: filas.map((f, i) => ({
              id: f.envio_id,
              resend_id: r.ids[i],
              error: r.ids[i] ? null : r.errores.get(i) ?? "No se pudo enviar",
            })),
          });
          const enviados = r.ids.filter(Boolean).length;
          resultado.enviados += enviados;
          resultado.fallidos += filas.length - enviados;
          presupuesto -= enviados;
        } else if (r.kind === "limite_diario" || r.kind === "limite_mensual") {
          await liberarLote(db, loteId);
          await pausar(db, campana.id, r.kind);
          resultado.detenidoPor = r.kind;
          break cola;
        } else if (r.kind === "transitorio") {
          // El lote queda abierto: la siguiente corrida lo reenvía con la
          // misma llave de idempotencia.
          console.error("[club57-avisos] lote sin confirmar, se reintentará:", r.mensaje);
          resultado.detenidoPor = "error_temporal";
          break cola;
        } else {
          console.error("[club57-avisos] lote rechazado:", r.mensaje);
          await db.rpc("club57_email_lote_marcar", {
            p_lote: loteId,
            p_resultados: filas.map((f) => ({ id: f.envio_id, resend_id: null, error: r.mensaje })),
          });
          resultado.fallidos += filas.length;
        }

        if (r.usoDiario !== null) {
          proveedorConocido = true;
          presupuesto = Math.min(presupuesto, cfg.promoDailyCap - r.usoDiario);
        } else if (r.kind === "ok") {
          // Sin dato del proveedor: se confía en el conteo propio.
          proveedorConocido = true;
        }

        await db.rpc("club57_email_campana_recalcular", { p_campana: campana.id });
        await sleep(PAUSA_ENTRE_SOLICITUDES_MS);
      }
    }
  } finally {
    await db.rpc("club57_email_lock_soltar", { p_holder: holder });
  }
  return resultado;
}

// Para el panel: intenta tomar el candado unos segundos (cancelar o
// reintentar no debe pisar una corrida en curso).
export async function conCandado<T>(fn: (db: Db) => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  const db = createAvisosDb();
  const holder = randomUUID();
  for (let intento = 0; intento < 5; intento += 1) {
    const { data } = await db.rpc("club57_email_lock_tomar", { p_holder: holder, p_segundos: 30 });
    if (data === true) {
      try {
        return { ok: true, value: await fn(db) };
      } finally {
        await db.rpc("club57_email_lock_soltar", { p_holder: holder });
      }
    }
    await sleep(800);
  }
  return { ok: false };
}
