"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validarDatosEmpresa, type EmpresaDatosInput, type Errores } from "@/lib/club57/empresas/datos";
import { sendEmail } from "@/lib/email/sendEmail";
import { getBusinessNotificationRecipients } from "@/lib/email/businessRecipients";
import {
  buildSolicitudEmpresaInternaEmail,
  buildSolicitudEmpresaRecibidaEmail,
} from "@/lib/email/empresarialEmails";

export interface SolicitudEmpresaInput extends EmpresaDatosInput {
  acepta: boolean;
  /** Campo trampa: los visitantes reales no lo ven ni lo llenan. */
  sitio_web?: string;
}

export interface SolicitudEmpresaResult {
  ok?: boolean;
  error?: string;
  errores?: Errores<keyof EmpresaDatosInput | "acepta">;
}

// Solicitud pública de afiliación a Club 57 Empresarial. Se guarda con la
// llave de servicio desde aquí (la tabla no acepta inserts del navegador) y
// queda en estado «solicitud» hasta que Ferretería 57 la revise y defina el
// convenio desde su panel.
export async function solicitarAfiliacionEmpresa(input: SolicitudEmpresaInput): Promise<SolicitudEmpresaResult> {
  // Un bot que llena el campo oculto recibe «ok» sin que se guarde nada.
  if (input.sitio_web && input.sitio_web.trim()) return { ok: true };

  const result = validarDatosEmpresa(input, { estricto: true });
  const errores: SolicitudEmpresaResult["errores"] = "errores" in result ? { ...result.errores } : {};
  if (!input.acepta) errores.acepta = "Necesitamos tu autorización para revisar la solicitud.";
  if (Object.keys(errores).length > 0 || !("datos" in result)) {
    return { error: "Revisa los campos marcados.", errores };
  }
  const datos = result.datos;

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return { error: "No pudimos recibir tu solicitud en este momento. Intenta más tarde o escríbenos por WhatsApp." };
  }

  // Ya hay una solicitud o un convenio vigente con ese RFC.
  const { data: existente } = await supabase
    .from("club57_empresas")
    .select("id, estado")
    .eq("rfc", datos.rfc)
    .in("estado", ["solicitud", "activa", "suspendida"])
    .limit(1)
    .maybeSingle();
  if (existente) {
    return {
      error:
        existente.estado === "solicitud"
          ? "Ya recibimos una solicitud con ese RFC. Nuestro equipo te contactará pronto."
          : "Esa empresa ya tiene un convenio con nosotros. Escríbenos por WhatsApp si necesitas ayuda.",
    };
  }

  // Freno simple contra envíos repetidos: una solicitud por correo cada 24 h.
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("club57_empresas")
    .select("id", { count: "exact", head: true })
    .eq("responsable_correo", datos.responsable_correo)
    .gte("created_at", desde);
  if ((count ?? 0) > 0) {
    return { error: "Ya recibimos una solicitud con ese correo. Nuestro equipo te contactará pronto." };
  }

  const { data: empresa, error } = await supabase
    .from("club57_empresas")
    .insert({ ...datos, estado: "solicitud", origen: "solicitud", acepto_terminos_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !empresa) {
    console.error("[club57 empresarial] solicitud", error?.message);
    if (error?.code === "23505") {
      return { error: "Ya recibimos una solicitud con ese RFC. Nuestro equipo te contactará pronto." };
    }
    return { error: "No pudimos recibir tu solicitud. Intenta de nuevo en unos minutos." };
  }

  await supabase.from("club57_empresas_bitacora").insert({
    empresa_id: empresa.id,
    accion: "solicitud",
    detalle: "Solicitud desde el sitio",
  });

  const emailData = {
    nombreComercial: datos.nombre_comercial,
    razonSocial: datos.razon_social,
    rfc: datos.rfc,
    numEmpleados: datos.num_empleados,
    responsableNombre: datos.responsable_nombre,
    responsableCorreo: datos.responsable_correo,
    responsableTelefono: datos.responsable_telefono,
  };
  const interno = buildSolicitudEmpresaInternaEmail(emailData);
  const confirmacion = buildSolicitudEmpresaRecibidaEmail(emailData);
  const [r1, r2] = await Promise.all([
    sendEmail({ to: getBusinessNotificationRecipients(), ...interno }),
    sendEmail({ to: datos.responsable_correo, ...confirmacion }),
  ]);
  if (r1.error) console.error("[club57 empresarial] aviso interno", r1.error);
  if (r2.error) console.error("[club57 empresarial] confirmación", r2.error);

  return { ok: true };
}
