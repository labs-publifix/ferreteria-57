"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Club57CatalogActionResult {
  error?: string;
}

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

function parseCatalogForm(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const clave = String(formData.get("clave") ?? "").trim();
  const costoPuntos = Number.parseInt(String(formData.get("costoPuntos") ?? ""), 10);
  const stock = Number.parseInt(String(formData.get("stock") ?? ""), 10);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!nombre) return { error: "Escribe el nombre del artículo." } as const;
  if (Number.isNaN(costoPuntos) || costoPuntos <= 0) {
    return { error: "Los puntos requeridos deben ser un número mayor a 0." } as const;
  }
  if (Number.isNaN(stock) || stock < 0) {
    return { error: "El stock debe ser un número mayor o igual a 0." } as const;
  }
  // Mismo criterio que productos: sin imagen real, no se puede activar.
  if (active && !imageUrl) {
    return { error: "Agrega una imagen para poder activar el artículo." } as const;
  }

  return {
    nombre,
    descripcion,
    clave: clave || null,
    costoPuntos,
    stock,
    imageUrl: imageUrl || null,
    active,
  } as const;
}

export async function createCatalogItem(formData: FormData): Promise<Club57CatalogActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseCatalogForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("club57_redemption_catalog").insert({
    nombre: parsed.nombre,
    descripcion: parsed.descripcion,
    clave: parsed.clave,
    costo_puntos: parsed.costoPuntos,
    stock: parsed.stock,
    image_url: parsed.imageUrl,
    active: parsed.active,
  });
  if (error) return { error: `No se pudo crear el artículo: ${error.message}` };

  revalidatePath("/admin/lealtad/catalogo");
  redirect("/admin/lealtad/catalogo");
}

export async function updateCatalogItem(
  id: string,
  formData: FormData
): Promise<Club57CatalogActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseCatalogForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("club57_redemption_catalog")
    .update({
      nombre: parsed.nombre,
      descripcion: parsed.descripcion,
      clave: parsed.clave,
      costo_puntos: parsed.costoPuntos,
      stock: parsed.stock,
      image_url: parsed.imageUrl,
      active: parsed.active,
    })
    .eq("id", id);
  if (error) return { error: `No se pudo actualizar el artículo: ${error.message}` };

  revalidatePath("/admin/lealtad/catalogo");
  redirect("/admin/lealtad/catalogo");
}

// "Eliminar" en la tabla llama a esta función con active=false — nunca un
// DELETE real (ver nota en Club57CatalogTable): el mismo control también
// sirve para reactivar un artículo pasándole true.
export async function toggleCatalogItemActive(
  id: string,
  active: boolean
): Promise<Club57CatalogActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  if (active) {
    const { data: item, error: fetchError } = await supabase
      .from("club57_redemption_catalog")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) return { error: `No se pudo validar el artículo: ${fetchError.message}` };
    if (!item?.image_url) {
      return { error: "Agrega una imagen para poder activar el artículo." };
    }
  }

  const { error } = await supabase.from("club57_redemption_catalog").update({ active }).eq("id", id);
  if (error) return { error: `No se pudo actualizar el artículo: ${error.message}` };

  revalidatePath("/admin/lealtad/catalogo");
  return {};
}
