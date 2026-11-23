"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarSolicitudVinculo } from "@/lib/club57/empresas/notificaciones";

// Club 57 Empresarial del lado del empleado: validar el código de su
// empresa, vincularse (desde Mi cuenta o al registrarse) y retirar una
// solicitud. La regla vive en la base (club57_vincular_empresa,
// club57_crear_vinculo); aquí solo se traducen los mensajes y se avisa al
// responsable.

export interface CodigoEmpresaInfo {
  nombre?: string;
  exigeNumero?: boolean;
  error?: string;
}

export async function validarCodigoEmpresa(codigo: string): Promise<CodigoEmpresaInfo> {
  const limpio = codigo.trim().toUpperCase();
  if (!/^F57-[A-Z]{1,6}-[A-Z0-9]{4}$/.test(limpio)) {
    return { error: "El código tiene la forma F57-XXXX-XXXX. Revísalo con tu empresa." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("club57_empresa_por_codigo", { p_codigo: limpio });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { error: "No encontramos una empresa activa con ese código. Revísalo con tu empresa." };
  return { nombre: row.nombre_comercial as string, exigeNumero: Boolean(row.exige_numero_empleado) };
}

export interface VincularResult {
  estado?: "pendiente" | "activo";
  error?: string;
}

const MENSAJES: Record<string, string> = {
  F57EC: "No encontramos una empresa activa con ese código. Revísalo con tu empresa.",
  F57EN: "Tu empresa pide tu número de empleado.",
  F57EV: "Ya tienes una empresa vinculada o una solicitud en revisión.",
  F57EA: "Necesitamos tu autorización para vincularte con tu empresa.",
};

export async function vincularEmpresa(codigo: string, numero: string, acepta: boolean): Promise<VincularResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para vincular tu empresa." };

  const { data, error } = await supabase.rpc("club57_vincular_empresa", {
    p_codigo: codigo.trim().toUpperCase(),
    p_numero: numero.trim().slice(0, 40),
    p_acepta: acepta,
  });
  if (error) return { error: (error.code && MENSAJES[error.code]) || error.message || "No se pudo vincular tu empresa." };

  const estado = data === "activo" ? "activo" : "pendiente";
  if (estado === "pendiente") {
    const { data: vinculo } = await supabase
      .from("club57_empresa_empleados")
      .select("id")
      .eq("member_id", user.id)
      .eq("estado", "pendiente")
      .maybeSingle();
    if (vinculo) await notificarSolicitudVinculo(vinculo.id);
  }
  revalidatePath("/cuenta");
  return { estado };
}

export async function cancelarVinculoEmpresa(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("club57_cancelar_vinculo");
  if (error) return { error: error.message || "No se pudo retirar la solicitud." };
  revalidatePath("/cuenta");
  return {};
}

// Justo después de un registro con «Tengo código de empresa» (todavía sin
// sesión, porque falta confirmar el correo): el vínculo ya lo creó la base
// al crear la cuenta; aquí solo se avisa al responsable. Idempotente: un
// vínculo ya notificado, o de hace más de 30 minutos, se ignora.
export async function avisarRegistroConEmpresa(email: string): Promise<void> {
  const correo = email.trim().toLowerCase();
  if (!correo.includes("@")) return;
  try {
    const supabase = createAdminClient();
    const { data: member } = await supabase.from("club57_members").select("id").eq("email", correo).maybeSingle();
    if (!member) return;
    const desde = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: vinculo } = await supabase
      .from("club57_empresa_empleados")
      .select("id")
      .eq("member_id", member.id)
      .eq("estado", "pendiente")
      .eq("origen", "registro")
      .is("notificado_at", null)
      .gte("solicitado_at", desde)
      .maybeSingle();
    if (vinculo) await notificarSolicitudVinculo(vinculo.id);
  } catch (error) {
    console.error("[club57 empresarial] aviso tras registro", error instanceof Error ? error.message : error);
  }
}
