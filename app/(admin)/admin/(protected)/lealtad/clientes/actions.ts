"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { generateSecurePassword } from "@/lib/generatePassword";

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
//
// Usa la service_role a propósito, sin importar si quien llama es admin o
// vendedor: un vendedor solo VE (por RLS) a sus propios clientes, pero el
// bloqueo de duplicados tiene que mirar a TODOS los clientes de Club 57
// (de otros vendedores, de un admin, o autoregistrados) — si esta
// búsqueda respetara ese mismo RLS, un vendedor podría dar de alta a un
// cliente que ya existe con otro dueño sin que nada se lo impida.
export async function findClub57MemberByContact(query: string): Promise<FindMemberResult> {
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };

  const normalized = query.trim();
  if (!normalized) return { error: "Escribe un correo o teléfono para buscar." };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
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
//
// admin.createUser() dispara handle_new_user() (migración de autoregistro),
// que YA inserta la fila en club57_members (full_name/email/referral_code,
// phone null, origen_alta='autoregistro') antes de que este código
// siquiera corra — un insert aparte aquí choca con esa fila por la misma
// primary key. Se usa upsert para completar lo que el trigger dejó a
// medias (phone, origen_alta='vendedor') sin tocar referral_code, que debe
// quedar exactamente como el trigger ya lo generó.
export async function createClub57Member(
  fullName: string,
  email: string,
  phone: string
): Promise<CreateMemberResult> {
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };

  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  if (!normalizedName) return { error: "Escribe el nombre del cliente." };
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { error: "Escribe un correo válido." };
  if (!normalizedPhone) return { error: "Escribe el teléfono del cliente." };

  const adminClient = createAdminClient();

  // Mismo motivo que findClub57MemberByContact: la búsqueda de duplicados
  // tiene que ver a TODOS los clientes de Club 57, sin importar de qué
  // vendedor/admin sean o si se autoregistraron — nunca se confía en que
  // ya se buscó en el paso anterior de este mismo flujo (pudo pasar
  // tiempo, o pudo llamarse esta acción directo).
  const { data: existing, error: existingError } = await adminClient
    .from("club57_members")
    .select("id")
    .or(`email.eq.${normalizedEmail},phone.eq.${normalizedPhone}`)
    .maybeSingle();
  if (existingError) return { error: `No se pudo validar duplicados: ${existingError.message}` };
  if (existing) return { error: "Ya existe un cliente con ese correo o teléfono." };

  const temporaryPassword = generateSecurePassword();

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: normalizedName },
  });

  if (authError || !authUser?.user) {
    return { error: `No se pudo crear la cuenta: ${authError?.message ?? "error desconocido"}` };
  }

  const { error: memberError } = await adminClient.from("club57_members").upsert(
    {
      id: authUser.user.id,
      full_name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      origen_alta: "vendedor",
      // Solo se llena cuando quien da de alta es un vendedor — un admin
      // completo sigue dejando este campo en null, igual que el
      // autoregistro online.
      creado_por_vendedor_id: staff.role === "vendedor" ? staff.userId : null,
    },
    { onConflict: "id" }
  );

  if (memberError) {
    // Deshace el usuario de Auth ya creado — nunca debe quedar una cuenta
    // sin su registro de Club 57 correspondiente.
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return { error: `No se pudo registrar el cliente: ${memberError.message}` };
  }

  revalidatePath("/admin/lealtad/clientes");
  revalidatePath("/admin/vendedor/clientes");

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
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };
  const { supabase } = staff;

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

  // Mismo bono de referido que ya aplica create_order (ver migración
  // 20260926010000) — se llama DESPUÉS de insertar la compra: si esta es
  // la primera compra real del cliente (online o manual) y tiene
  // referred_by, otorga los puntos a ambos lados, una sola vez por
  // relación. Un error aquí nunca debe tumbar la confirmación de la
  // compra ya registrada arriba — solo se registra para revisar después.
  const { error: bonusError } = await supabase.rpc("grant_club57_referral_bonus", { p_member_id: memberId });
  if (bonusError) {
    console.error("Club 57: no se pudo aplicar el bono de referido", bonusError);
  }

  revalidatePath(`/admin/lealtad/clientes/${memberId}`);
  revalidatePath(`/admin/vendedor/clientes/${memberId}`);
  return { puntos };
}
