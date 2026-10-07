"use server";

// Server Actions del aviso por email de promociones (módulo nuevo; las
// acciones existentes de promociones viven en ./actions.ts y no cambian).
// Todo pasa por: admin verificado + interruptor CLUB57_PROMO_EMAILS_ENABLED.
// Los textos que regresan se muestran tal cual en el panel: lenguaje
// neutro de negocio, sin detalles técnicos del servicio de correo.
import { revalidatePath } from "next/cache";
import { createAvisosDb } from "@/lib/club57/avisos/db";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { todayInStoreTimezone } from "@/lib/marketing/visibility";
import type { PromoTipo } from "@/lib/club57/promociones/config";
import { promoEstadoVisible } from "@/lib/club57/promociones/vigencia";
import { getAvisosBaseUrl, getAvisosConfig } from "@/lib/club57/avisos/config";
import { instanteNegocio } from "@/lib/club57/avisos/estimacion";
import {
  avisoAsunto,
  avisoAsuntoMuestra,
  avisoBajaOneClickUrl,
  avisoBajaUrl,
  buildAvisoEmail,
} from "@/lib/club57/avisos/plantillas";
import { enviarPrueba } from "@/lib/club57/avisos/sender";
import { firmarBaja } from "@/lib/club57/avisos/token";
import { conCandado, procesarAvisos } from "@/lib/club57/avisos/processor";
import { loadAvisosLista, loadCampanasDePromo, loadCapacidad, loadColaActiva } from "@/lib/club57/avisos/consultas";
import type { AvisoPanelData, AvisosListaData } from "@/lib/club57/avisos/tipos";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_DISPONIBLE = "El aviso por email no está disponible.";
const LIMITE_HOY = "Se alcanzó el límite de envíos de hoy; el aviso continuará mañana.";
const LIMITE_MES = "Se alcanzó el límite de envíos de este mes; el aviso continuará cuando se renueve la capacidad.";
const ENVIO_EN_CURSO = "Hay un envío en curso. Intenta de nuevo en unos segundos.";

// "Enviar ahora" manda en el momento lo que cabe en ~8 s (de sobra para
// la capacidad diaria actual); lo demás sigue con el envío diario.
const PRESUPUESTO_AHORA_MS = 8000;

async function requireAdminAvisos() {
  if (!getAvisosConfig().enabled) return null;
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return null;
  return staff;
}

interface PromoRow {
  id: string;
  tipo: PromoTipo;
  titulo: string;
  estado: string;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
}

async function loadPromo(promocionId: string) {
  const db = createAvisosDb();
  const { data } = await db
    .from("club57_promociones")
    .select("id, tipo, titulo, estado, vigencia_inicio, vigencia_fin")
    .eq("id", promocionId)
    .maybeSingle();
  const promo = data as PromoRow | null;
  if (!promo || promo.estado !== "publicada" || !promo.vigencia_inicio || !promo.vigencia_fin) return null;
  return { ...promo, inicio: promo.vigencia_inicio, fin: promo.vigencia_fin };
}

function revalidar() {
  revalidatePath("/admin/lealtad/promociones", "layout");
}

export async function cargarAvisoPanel(promocionId: string): Promise<{ data?: AvisoPanelData; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  if (!UUID_PATTERN.test(promocionId)) return { error: "Promoción no encontrada." };

  const promo = await loadPromo(promocionId);
  if (!promo) return { error: "Solo se puede avisar de una promoción publicada." };
  const hoy = todayInStoreTimezone();
  const estadoVisible = promoEstadoVisible({ inicio: promo.inicio, fin: promo.fin }, hoy);

  const db = createAvisosDb();
  const [{ data: conteo }, cola, user] = await Promise.all([
    db.rpc("club57_email_elegibles_conteo", { p_promocion: promo.id }),
    loadColaActiva(db),
    session.supabase.auth.getUser(),
  ]);
  const fila = (conteo as { todos: number; no_recibieron: number }[] | null)?.[0];
  const destinatarios = { todos: Number(fila?.todos ?? 0), noRecibieron: Number(fila?.no_recibieron ?? 0) };
  const capacidad = await loadCapacidad(db, destinatarios.todos);
  const campanas = await loadCampanasDePromo(db, promo.id, capacidad);

  return {
    data: {
      promo: { id: promo.id, tipo: promo.tipo, titulo: promo.titulo, inicio: promo.inicio, fin: promo.fin, estadoVisible },
      hoy,
      asuntoMuestra: avisoAsuntoMuestra(promo.tipo, { inicio: promo.inicio, fin: promo.fin }, hoy),
      destinatarios,
      capacidad: {
        capDiario: capacidad.capDiario,
        usadosHoy: capacidad.usadosHoy,
        restantesHoy: capacidad.restantesHoy,
        cercaLimiteMensual: capacidad.cercaLimiteMensual,
      },
      cola,
      campanas,
      adminEmail: user.data.user?.email ?? null,
      ahoraMs: Date.now(),
      programadoInicioMs: instanteNegocio(promo.inicio).getTime(),
    },
  };
}

export async function cargarAvisosLista(promocionIds: string[]): Promise<{ data?: AvisosListaData; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  const ids = promocionIds.filter((id) => UUID_PATTERN.test(id)).slice(0, 200);
  return { data: await loadAvisosLista(ids) };
}

export async function enviarAvisoPrueba(promocionId: string): Promise<{ email?: string; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  if (!UUID_PATTERN.test(promocionId)) return { error: "Promoción no encontrada." };
  const promo = await loadPromo(promocionId);
  if (!promo) return { error: "Solo se puede avisar de una promoción publicada." };

  const {
    data: { user },
  } = await session.supabase.auth.getUser();
  if (!user?.email) return { error: "Tu cuenta de administrador no tiene un correo para recibir la prueba." };

  const db = createAvisosDb();
  const capacidad = await loadCapacidad(db);
  if (capacidad.restantesHoy <= 0) return { error: LIMITE_HOY };

  const { data: perfil } = await db.from("club57_members").select("full_name").eq("id", user.id).maybeSingle();
  const hoy = todayInStoreTimezone();
  const baseUrl = getAvisosBaseUrl();
  const token = firmarBaja(user.id);
  const correo = buildAvisoEmail({
    tipo: promo.tipo,
    nombre: (perfil?.full_name as string | undefined) ?? null,
    puntos: null,
    rango: { inicio: promo.inicio, fin: promo.fin },
    hoy,
    baseUrl,
    bajaUrl: avisoBajaUrl(baseUrl, user.id, token),
  });

  const resultado = await enviarPrueba({
    to: user.email,
    ...correo,
    subject: `[Prueba] ${correo.subject}`,
    bajaOneClickUrl: avisoBajaOneClickUrl(baseUrl, user.id, token),
    tipo: promo.tipo,
  });

  await db.from("club57_email_pruebas").insert({
    promocion_id: promo.id,
    email: user.email,
    resend_id: resultado.id,
    error: resultado.error ? resultado.detalle ?? resultado.error : null,
    created_by: user.id,
  });

  if (resultado.error === "limite_diario") return { error: LIMITE_HOY };
  if (resultado.error === "limite_mensual") return { error: LIMITE_MES };
  if (resultado.error || !resultado.id) {
    console.error("[avisos] prueba no enviada:", resultado.detalle);
    return { error: "No se pudo enviar la prueba. Intenta de nuevo en unos minutos." };
  }
  revalidar();
  return { email: user.email };
}

export async function crearAviso(input: {
  promocionId: string;
  modo: "ahora" | "programar";
  alcance: "todos" | "no_recibieron";
  confirmarRepetido?: boolean;
}): Promise<{ ok?: true; enviadosAhora?: number; aviso?: string; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  if (!UUID_PATTERN.test(input.promocionId)) return { error: "Promoción no encontrada." };
  if (input.modo !== "ahora" && input.modo !== "programar") return { error: "Elige cuándo enviar el aviso." };
  if (input.alcance !== "todos" && input.alcance !== "no_recibieron") return { error: "Elige a quién enviar el aviso." };

  const promo = await loadPromo(input.promocionId);
  if (!promo) return { error: "Solo se puede avisar de una promoción publicada." };
  const hoy = todayInStoreTimezone();
  if (hoy > promo.fin) return { error: "La promoción ya venció." };
  if (input.modo === "ahora" && hoy < promo.inicio) {
    return { error: "La vigencia todavía no empieza: programa el aviso para el inicio de la vigencia." };
  }
  if (input.modo === "programar" && hoy >= promo.inicio) {
    return { error: "La vigencia ya empezó: envía el aviso ahora." };
  }

  const db = createAvisosDb();
  const { data: previas } = await db
    .from("club57_email_campanas")
    .select("id, estado, enviados")
    .eq("promocion_id", promo.id);
  const filas = (previas ?? []) as { id: string; estado: string; enviados: number }[];
  if (filas.some((c) => c.estado === "programada" || c.estado === "en_proceso")) {
    return { error: "Esta promoción ya tiene un aviso programado o en curso." };
  }
  if (input.alcance === "todos" && filas.some((c) => c.enviados > 0) && !input.confirmarRepetido) {
    return { error: "Esta promoción ya se avisó antes. Confirma que quieres enviarlo otra vez a todos." };
  }

  const programado = input.modo === "ahora" ? new Date() : instanteNegocio(promo.inicio);
  const asunto = avisoAsunto(promo.tipo, null, { inicio: promo.inicio, fin: promo.fin }, hoy);
  const { error } = await db.rpc("club57_email_campana_crear", {
    p_promocion: promo.id,
    p_asunto: asunto,
    p_programado_para: programado.toISOString(),
    p_alcance: input.alcance,
    p_created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: "Esta promoción ya tiene un aviso programado o en curso." };
    if (error.code === "F57AV") return { error: error.message };
    console.error("[avisos] no se pudo crear:", error.message);
    return { error: "No se pudo crear el aviso. Intenta de nuevo." };
  }

  let enviadosAhora: number | undefined;
  let aviso: string | undefined;
  if (input.modo === "ahora") {
    const corrida = await procesarAvisos({ presupuestoMs: PRESUPUESTO_AHORA_MS });
    enviadosAhora = corrida.enviados;
    if (corrida.detenidoPor === "limite_diario") aviso = LIMITE_HOY;
    else if (corrida.detenidoPor === "limite_mensual") aviso = LIMITE_MES;
    else if (corrida.estado === "ocupado") aviso = "Ya hay un envío en curso: este aviso sale en cuanto termine.";
  }
  revalidar();
  return { ok: true, enviadosAhora, aviso };
}

export async function cancelarAviso(campanaId: string): Promise<{ ok?: true; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  if (!UUID_PATTERN.test(campanaId)) return { error: "Aviso no encontrado." };

  const r = await conCandado(async (db) => {
    const { data } = await db
      .from("club57_email_campanas")
      .update({ estado: "cancelada", finalizada_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", campanaId)
      .in("estado", ["programada", "en_proceso"])
      .select("id");
    if (!data?.length) return false;
    await db
      .from("club57_email_envios")
      .update({ estado: "omitido", motivo: "cancelada", updated_at: new Date().toISOString() })
      .eq("campana_id", campanaId)
      .eq("estado", "pendiente");
    await db.rpc("club57_email_campana_recalcular", { p_campana: campanaId });
    return true;
  });
  if (!r.ok) return { error: ENVIO_EN_CURSO };
  if (!r.value) return { error: "Este aviso ya no se puede cancelar." };
  revalidar();
  return { ok: true };
}

export async function reintentarFallidosAviso(campanaId: string): Promise<{ ok?: true; enviadosAhora?: number; aviso?: string; error?: string }> {
  const session = await requireAdminAvisos();
  if (!session) return { error: NO_DISPONIBLE };
  if (!UUID_PATTERN.test(campanaId)) return { error: "Aviso no encontrado." };

  const db = createAvisosDb();
  const { data: campana } = await db
    .from("club57_email_campanas")
    .select("id, estado, promocion_id, fallidos")
    .eq("id", campanaId)
    .maybeSingle();
  if (!campana || campana.fallidos <= 0) return { error: "Este aviso no tiene envíos fallidos." };
  if (campana.estado === "cancelada") return { error: "Este aviso se canceló." };
  const promo = await loadPromo(campana.promocion_id as string);
  if (!promo || todayInStoreTimezone() > promo.fin) return { error: "La promoción ya venció." };

  const { data: otraActiva } = await db
    .from("club57_email_campanas")
    .select("id")
    .eq("promocion_id", promo.id)
    .in("estado", ["programada", "en_proceso"])
    .neq("id", campanaId)
    .limit(1);
  if (otraActiva?.length) return { error: "Esta promoción ya tiene otro aviso en curso." };

  const r = await conCandado(async (lockDb) => {
    await lockDb
      .from("club57_email_envios")
      .update({ estado: "pendiente", lote_id: null, error: null, updated_at: new Date().toISOString() })
      .eq("campana_id", campanaId)
      .eq("estado", "fallido");
    await lockDb
      .from("club57_email_campanas")
      .update({ estado: "en_proceso", finalizada_at: null, updated_at: new Date().toISOString() })
      .eq("id", campanaId);
    await lockDb.rpc("club57_email_campana_recalcular", { p_campana: campanaId });
  });
  if (!r.ok) return { error: ENVIO_EN_CURSO };

  let aviso: string | undefined;
  let enviadosAhora: number | undefined;
  if (todayInStoreTimezone() >= promo.inicio) {
    const corrida = await procesarAvisos({ presupuestoMs: PRESUPUESTO_AHORA_MS });
    enviadosAhora = corrida.enviados;
    if (corrida.detenidoPor === "limite_diario") aviso = LIMITE_HOY;
    else if (corrida.detenidoPor === "limite_mensual") aviso = LIMITE_MES;
  }
  revalidar();
  return { ok: true, enviadosAhora, aviso };
}
