"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { generateSecurePassword } from "@/lib/generatePassword";
import { addDaysInStoreTimezone } from "@/lib/marketing/visibility";

export interface Club57MemberMatch {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface ContactDuplicateCheckResult {
  error?: string;
  duplicate?: { field: "email" | "phone"; fullName: string };
}

// Alta manual directa (#10b): ya no hay un paso de búsqueda previa
// obligatorio — el formulario abre directo. Esto es el chequeo TEMPRANO
// (onBlur, un campo a la vez) que solo avisa, nunca bloquea por sí solo:
// el bloqueo real ocurre en createClub57Member() al guardar, que vuelve a
// validar sin confiar en que este chequeo ya corrió (pudo no dispararse,
// o pudo pasar tiempo y alguien más registrar ese contacto mientras
// tanto). Reutiliza el mismo RPC find_club57_contact_duplicate() que usa
// createClub57Member — una sola fuente de verdad para la normalización de
// email/teléfono (ver migración 20261004010000_club57_contact_duplicate_check.sql).
export async function checkClub57ContactDuplicate(
  field: "email" | "phone",
  value: string
): Promise<ContactDuplicateCheckResult> {
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };

  const trimmed = value.trim();
  if (!trimmed) return {};

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("find_club57_contact_duplicate", {
    p_email: field === "email" ? trimmed : "",
    p_phone: field === "phone" ? trimmed : "",
  });
  if (error) return { error: `No se pudo validar: ${error.message}` };

  const match = data?.[0];
  if (!match) return {};
  return { duplicate: { field, fullName: match.full_name } };
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
  phone: string,
  referralCodeInput: string = ""
): Promise<CreateMemberResult> {
  const staff = await requireStaff();
  if (!staff) return { error: "No autorizado." };

  const normalizedName = fullName.trim();
  // Sin espacios (no solo trim — un espacio interno pegado al copiar/pegar
  // no debe colarse al correo guardado) + minúsculas.
  const normalizedEmail = email.replace(/\s+/g, "").toLowerCase();
  const normalizedPhone = phone.trim();
  const normalizedReferralCode = referralCodeInput.trim();

  if (!normalizedName) return { error: "Escribe el nombre del cliente." };
  if (!normalizedEmail || !normalizedEmail.includes("@")) return { error: "Escribe un correo válido." };
  if (!normalizedPhone) return { error: "Escribe el teléfono del cliente." };

  const adminClient = createAdminClient();

  // Único punto de bloqueo real (#10b: ya no hay paso de búsqueda previa
  // en la UI, checkClub57ContactDuplicate() en onBlur solo avisa temprano
  // sin bloquear). Nunca se confía en que el aviso de la UI ya corrió —
  // esta revalidación es independiente y siempre se ejecuta. Compara
  // email normalizado (sin espacios, minúsculas) y teléfono por sus
  // últimos 10 dígitos vía el mismo RPC que usa el chequeo onBlur (ver
  // migración 20261004010000_club57_contact_duplicate_check.sql) — tiene
  // que ver a TODOS los clientes de Club 57, sin importar de qué
  // vendedor/admin sean o si se autoregistraron, por eso usa el cliente
  // service_role en vez del RLS normal.
  const { data: duplicates, error: dupError } = await adminClient.rpc("find_club57_contact_duplicate", {
    p_email: normalizedEmail,
    p_phone: normalizedPhone,
  });
  if (dupError) return { error: `No se pudo validar duplicados: ${dupError.message}` };
  const duplicate = duplicates?.[0];
  if (duplicate) {
    const fieldLabel = duplicate.matched_field === "email" ? "correo" : "teléfono";
    return {
      error: `Ya existe un cliente con ese ${fieldLabel}: ${duplicate.full_name}. Búscalo en la lista de clientes para ayudarlo.`,
    };
  }

  // El código de quien invitó es opcional, pero si se escribió algo tiene
  // que ser válido — mismo criterio que el registro online, nunca se
  // descarta en silencio. Los códigos siempre se generan en mayúsculas
  // (generate_club57_referral_code()), así que comparar contra la versión
  // en mayúsculas del texto escrito ya es case-insensitive sin arriesgar
  // un ilike con comodines si alguien tecleara "%" o "_" por error.
  let referredById: string | null = null;
  if (normalizedReferralCode) {
    const { data: referrer, error: referrerError } = await adminClient
      .from("club57_members")
      .select("id")
      .eq("referral_code", normalizedReferralCode.toUpperCase())
      .maybeSingle();
    if (referrerError) return { error: `No se pudo validar el código de referido: ${referrerError.message}` };
    if (!referrer) return { error: "No encontramos ese código, revísalo e intenta de nuevo." };
    referredById = referrer.id;
  }

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

  // Autorreferencia (Parte 3, defensivo): estructuralmente imposible que
  // el id recién creado ya existiera como dueño de un código, pero se
  // ignora igual que un código no encontrado si por lo que sea coincidiera.
  if (referredById === authUser.user.id) referredById = null;

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
      referred_by: referredById,
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

  const { error: insertError } = await supabase.from("club57_points_ledger").insert({
    member_id: memberId,
    cantidad: puntos,
    tipo: "compra_manual",
    estado: "pendiente",
    fecha_disponible: addDaysInStoreTimezone(Number(config.dias_espera_pendiente)),
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
