// Alta/baja de avisos de promociones de un miembro (service role: el
// enlace del correo no requiere sesión; la firma HMAC es la autorización).
// Solo toca promos_email_optout: los correos de pedidos y canjes no
// dependen de esta columna.
import { createAvisosDb } from "@/lib/club57/avisos/db";
import { verificarBaja } from "./token";

export type ResultadoBaja = "ok" | "invalido" | "error";

export async function cambiarSuscripcionAvisos(
  memberId: string | null | undefined,
  token: string | null | undefined,
  optout: boolean
): Promise<ResultadoBaja> {
  if (!verificarBaja(memberId, token)) return "invalido";
  try {
    const db = createAvisosDb();
    const { data, error } = await db
      .from("club57_members")
      .update({ promos_email_optout: optout, promos_email_optout_at: optout ? new Date().toISOString() : null })
      .eq("id", memberId!)
      .select("id");
    if (error) {
      console.error("[club57 baja]", error.message);
      return "error";
    }
    return data && data.length > 0 ? "ok" : "invalido";
  } catch (error) {
    console.error("[club57 baja]", error);
    return "error";
  }
}

export async function estadoSuscripcionAvisos(
  memberId: string | null | undefined,
  token: string | null | undefined
): Promise<{ valido: false } | { valido: true; optout: boolean }> {
  if (!verificarBaja(memberId, token)) return { valido: false };
  const db = createAvisosDb();
  const { data } = await db.from("club57_members").select("promos_email_optout").eq("id", memberId!).maybeSingle();
  if (!data) return { valido: false };
  return { valido: true, optout: Boolean(data.promos_email_optout) };
}
