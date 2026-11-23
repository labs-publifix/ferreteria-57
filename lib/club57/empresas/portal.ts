import { createClient } from "@/lib/supabase/server";
import type { EstadoEmpresa, FrecuenciaNomina } from "./datos";

// Portal Empresa: la empresa que administra la sesión (su responsable).
// Solo empresas activas o suspendidas; la lectura la permite la política
// «El responsable lee su empresa» (migración 20261128010000).

export interface PortalEmpresa {
  id: string;
  nombre_comercial: string;
  razon_social: string;
  estado: EstadoEmpresa;
  motivo_estado: string | null;
  codigo: string | null;
  limite_credito: number | null;
  dia_corte: number | null;
  plazo_pago_dias: number | null;
  plazo_autorizacion_dias: number;
  exige_numero_empleado: boolean;
  nomina_frecuencia: FrecuenciaNomina | null;
  nomina_dia_semana: number | null;
  nomina_dia_mes: number | null;
  descuentos_por_compra: number;
  politica_porcentaje: number | null;
  responsable_nombre: string;
}

export async function getPortalEmpresa() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, empresa: null };
  const { data } = await supabase
    .from("club57_empresas")
    .select(
      "id, nombre_comercial, razon_social, estado, motivo_estado, codigo, limite_credito, dia_corte, plazo_pago_dias, plazo_autorizacion_dias, exige_numero_empleado, nomina_frecuencia, nomina_dia_semana, nomina_dia_mes, descuentos_por_compra, politica_porcentaje, responsable_nombre"
    )
    .eq("responsable_user_id", user.id)
    .in("estado", ["activa", "suspendida"])
    .order("activada_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const empresa: PortalEmpresa | null = data
    ? {
        ...(data as PortalEmpresa),
        limite_credito: data.limite_credito === null ? null : Number(data.limite_credito),
        politica_porcentaje: data.politica_porcentaje === null ? null : Number(data.politica_porcentaje),
      }
    : null;
  return { supabase, user, empresa };
}

export interface PortalEmpleado {
  id: string;
  member_id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  numero_empleado: string | null;
  estado: "pendiente" | "activo" | "rechazado" | "cancelado" | "baja";
  linea_tipo: "porcentaje" | "monto" | null;
  linea_porcentaje: number | null;
  linea_credito: number | null;
  salario_mensual: number | null;
  nomina_frecuencia: FrecuenciaNomina | null;
  nomina_dia_semana: number | null;
  nomina_dia_mes: number | null;
  motivo: string | null;
  origen: "registro" | "cuenta";
  aprobado_automatico: boolean;
  solicitado_at: string;
  resuelto_at: string | null;
}

export function mapPortalEmpleado(row: Record<string, unknown>): PortalEmpleado {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    ...(row as unknown as PortalEmpleado),
    linea_porcentaje: num(row.linea_porcentaje),
    linea_credito: num(row.linea_credito),
    salario_mensual: num(row.salario_mensual),
  };
}
