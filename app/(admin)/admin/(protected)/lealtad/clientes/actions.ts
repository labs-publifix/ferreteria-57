"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateSecurePassword } from "@/lib/generatePassword";

// Mismo criterio que el resto del admin: cada Server Action confirma
// is_admin() por su cuenta, sin confiar en que el middleware ya filtró la
// request. Devuelve el cliente normal (respeta RLS) — createAdminClient
// (service_role) solo se usa puntualmente donde hace falta saltarse RLS o
// tocar la Admin API de Auth (crear el usuario), nunca como reemplazo
// general de este chequeo.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return null;

  return supabase;
}

export interface Club57MemberMatch {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface FindMemberResult {
  error?: string;
  matches?: Club57MemberMatch[];
}

// Búsqueda de duplicados EXACTA (no un buscador difuso como el de la lista
// de clientes) — email normalizado a minúsculas, teléfono tal cual se
// guardó. El objetivo es "¿ya existe este contacto puntual?", no
// "¿hay algo parecido?": un match parcial aquí bloquearía altas legítimas
// de clientes distintos con datos similares.
export async function findClub57MemberByContact(query: string): Promise<FindMemberResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const normalized = query.trim();
  if (!normalized) return { error: "Escribe un correo o teléfono para buscar." };

  const { data, error } = await supabase
    .from("club57_members")
    .select("id, full_name, email, phone")
    .or(`email.eq.${normalized.toLowerCase()},phone.eq.${normalized}`);

  if (error) return { error: `No se pudo buscar: ${error.message}` };

  return {
    matches: (data ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
    })),
  };
}

export interface CreateMemberResult {
  error?: string;
  member?: Club57MemberMatch;
  temporaryPassword?: string;
}

// Alta manual desde el panel. Dos pasos que deben quedar consistentes
// entre sí (usuario de Auth + fila en club57_members): si el segundo
// falla después de que el primero ya se creó, se borra el usuario de Auth
// recién creado para no dejar una cuenta huérfana sin perfil de Club 57 —
// mismo criterio de "deshacer el primer paso si el segundo falla" que ya
// usa createProductRecord (ver lib/catalog/productWrite.ts) para
// producto+variantes.
export async function createClub57Member(
  fullName: string,
  email: string,
  phone: string
): Promise<CreateMemberResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  if (!normalizedName) return { error: "Escribe el nombre del cliente." };
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { error: "Escribe un correo válido." };
  if (!normalizedPhone) return { error: "Escribe el teléfono del cliente." };

  // Nunca se confía en que el admin ya buscó y no encontró nada en el paso
  // anterior de este mismo flujo (pudo pasar tiempo, o pudo llamarse esta
  // acción directo) — se vuelve a checar aquí, contra el estado real de la
  // base, justo antes de crear nada.
  const { data: existing, error: existingError } = await supabase
    .from("club57_members")
    .select("id")
    .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
    .maybeSingle();
  if (existingError) return { error: `No se pudo validar duplicados: ${existingError.message}` };
  if (existing) return { error: "Ya existe un cliente con ese correo o teléfono." };

  const temporaryPassword = generateSecurePassword();

  const adminClient = createAdminClient();
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: normalizedName },
  });

  if (authError || !authUser?.user) {
    return { error: `No se pudo crear la cuenta: ${authError?.message ?? "error desconocido"}` };
  }

  const { error: memberError } = await adminClient.from("club57_members").insert({
    id: authUser.user.id,
    full_name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    origen_alta: "vendedor",
  });

  if (memberError) {
    // Deshace el usuario de Auth ya creado — nunca debe quedar una cuenta
    // sin su registro de Club 57 correspondiente.
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return { error: `No se pudo registrar el cliente: ${memberError.message}` };
  }

  revalidatePath("/admin/lealtad/clientes");

  return {
    member: { id: authUser.user.id, fullName: normalizedName, email: normalizedEmail, phone: normalizedPhone },
    temporaryPassword,
  };
}

export interface RegisterPurchaseResult {
  error?: string;
  puntos?: number;
}

// Descuenta nada, solo suma un movimiento 'pendiente' — el estado pasa a
// 'disponible' en un proceso de un prompt posterior (ver comentario en la
// migración sobre fecha_disponible). puntos = floor(monto / monto_por_punto):
// redondeado hacia abajo para nunca otorgar una fracción de punto.
// producto/codigo son opcionales (no todo lo que se vende en mostrador
// tiene un código a la mano) pero quedan guardados en columnas propias —
// mismos datos que ya captura un pedido real (product_name/sku en
// order_items) — para que el historial de un cliente diga QUÉ compró, no
// solo cuánto.
export async function registerClub57ManualPurchase(
  memberId: string,
  montoRaw: string,
  productoNombre: string,
  productoSku: string
): Promise<RegisterPurchaseResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const monto = Number.parseFloat(montoRaw);
  if (Number.isNaN(monto) || monto <= 0) {
    return { error: "El monto debe ser un número mayor a 0." };
  }
  const nombre = productoNombre.trim();
  if (!nombre) {
    return { error: "Escribe qué compró el cliente." };
  }
  const sku = productoSku.trim();

  const { data: member, error: memberError } = await supabase
    .from("club57_members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError) return { error: `No se pudo validar el cliente: ${memberError.message}` };
  if (!member) return { error: "Cliente no encontrado." };

  const { data: config, error: configError } = await supabase
    .from("club57_config")
    .select("monto_por_punto, dias_espera_pendiente")
    .maybeSingle();
  if (configError || !config) {
    return { error: `No se pudo leer la configuración de Club 57: ${configError?.message ?? "sin datos"}` };
  }

  const puntos = Math.floor(monto / Number(config.monto_por_punto));
  if (puntos <= 0) {
    return {
      error: `Ese monto no alcanza para ni 1 punto (se necesitan al menos $${config.monto_por_punto} MXN por punto).`,
    };
  }

  const fechaDisponible = new Date();
  fechaDisponible.setDate(fechaDisponible.getDate() + Number(config.dias_espera_pendiente));

  const { error: insertError } = await supabase.from("club57_points_ledger").insert({
    member_id: memberId,
    cantidad: puntos,
    tipo: "compra_manual",
    estado: "pendiente",
    fecha_disponible: fechaDisponible.toISOString().slice(0, 10),
    referencia: `Compra en tienda: $${monto.toFixed(2)} MXN`,
    producto_nombre: nombre,
    producto_sku: sku || null,
  });

  if (insertError) return { error: `No se pudo registrar la compra: ${insertError.message}` };

  revalidatePath(`/admin/lealtad/clientes/${memberId}`);
  return { puntos };
}
