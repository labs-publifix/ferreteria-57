"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";

export interface CategoryActionResult {
  error?: string;
}

// Mismo criterio de verificación que el resto del admin (ver
// app/(admin)/admin/(protected)/accesos/actions.ts): cada Server Action
// confirma is_admin() por su cuenta, sin asumir que nadie puede
// invocarla directo solo porque la página que la usa ya está protegida.
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

function parseCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const positionRaw = String(formData.get("position") ?? "0");
  const position = Number.parseInt(positionRaw, 10);
  const active = formData.get("active") === "on";

  if (!name || !slug || !icon) {
    return { error: "Completa nombre, slug e ícono." } as const;
  }
  if (!CATEGORY_ICON_OPTIONS.some((option) => option.value === icon)) {
    return { error: "Ícono no válido." } as const;
  }
  if (Number.isNaN(position)) {
    return { error: "La posición debe ser un número." } as const;
  }

  return { name, slug, icon, position, active } as const;
}

export async function createCategory(formData: FormData): Promise<CategoryActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseCategoryForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("categories").insert({
    name: parsed.name,
    slug: parsed.slug,
    icon: parsed.icon,
    position: parsed.position,
    active: parsed.active,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese slug." };
    }
    return { error: "No se pudo crear la categoría." };
  }

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<CategoryActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseCategoryForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.name,
      slug: parsed.slug,
      icon: parsed.icon,
      position: parsed.position,
      active: parsed.active,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese slug." };
    }
    return { error: "No se pudo actualizar la categoría." };
  }

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function toggleCategoryActive(
  id: string,
  active: boolean
): Promise<CategoryActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { error } = await supabase.from("categories").update({ active }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la categoría." };

  revalidatePath("/admin/categorias");
  return {};
}

// Solo borra de verdad si no tiene productos asociados — si tiene, el
// mensaje explica por qué y sugiere desactivarla en su lugar. La
// restricción "on delete restrict" en products.category_id (ver
// migración) es el resguardo por si algo se coló entre el conteo y el
// delete; este chequeo previo es para dar un mensaje claro en vez de un
// error crudo de Postgres.
export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    return {
      error: `No se puede eliminar: tiene ${count} producto(s) asociado(s). Desactívala en su lugar.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la categoría." };

  revalidatePath("/admin/categorias");
  return {};
}
