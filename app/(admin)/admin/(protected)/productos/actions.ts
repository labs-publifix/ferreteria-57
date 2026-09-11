"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveCategory } from "@/lib/catalog/resolveCategory";
import {
  createProductRecord,
  describeDbError,
  updateProductRecord,
  type ProductWriteInput,
} from "@/lib/catalog/productWrite";
import { findTakenSkus } from "@/lib/catalog/skuAvailability";
import { createClient } from "@/lib/supabase/server";
import type { TechnicalSpec } from "@/types/catalog";

export interface ProductActionResult {
  error?: string;
}

interface VariantInput {
  id?: string;
  sku: string;
  label: string;
  price: string;
  compareAtPrice: string;
  stock: string;
}

// Mismo criterio de verificación que el resto del admin (ver
// app/(admin)/admin/(protected)/accesos/actions.ts): cada Server Action
// confirma is_admin() por su cuenta.
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

// variants/technicalSpecs/images viajan como un solo campo de FormData
// con JSON adentro — FormData no tiene una forma nativa de mandar un
// arreglo de objetos, y esto evita inventar una convención de nombres
// tipo variants[0][sku] a mano en el cliente.
function parseProductForm(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const specSheetUrl = String(formData.get("specSheetUrl") ?? "").trim();
  const active = formData.get("active") === "on";

  let variants: VariantInput[];
  let technicalSpecs: TechnicalSpec[];
  let images: string[];
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
    technicalSpecs = JSON.parse(String(formData.get("technicalSpecs") ?? "[]"));
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { error: "No se pudo leer el formulario. Intenta de nuevo." } as const;
  }

  if (!categoryId || !name || !slug || !brand) {
    return { error: "Completa categoría, nombre, slug y marca." } as const;
  }
  if (variants.length === 0) {
    return { error: "Agrega al menos una presentación con su código, precio y stock." } as const;
  }
  if (active && images.length === 0) {
    return { error: "Agrega al menos una imagen para poder activar el producto." } as const;
  }

  const parsedVariants: {
    id?: string;
    sku: string;
    label: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
  }[] = [];

  for (const variant of variants) {
    const sku = variant.sku.trim();
    const label = variant.label.trim() || "Único";
    const price = Number.parseFloat(variant.price);
    const compareAtPrice = variant.compareAtPrice.trim()
      ? Number.parseFloat(variant.compareAtPrice)
      : null;
    const stock = Number.parseInt(variant.stock, 10);

    if (!sku) return { error: "Cada presentación necesita un código (SKU)." } as const;
    if (Number.isNaN(price) || price < 0) {
      return { error: `Precio inválido para "${sku}".` } as const;
    }
    if (compareAtPrice !== null && (Number.isNaN(compareAtPrice) || compareAtPrice < 0)) {
      return { error: `Precio anterior inválido para "${sku}".` } as const;
    }
    if (Number.isNaN(stock) || stock < 0) {
      return { error: `Stock inválido para "${sku}".` } as const;
    }

    parsedVariants.push({ id: variant.id, sku, label, price, compareAtPrice, stock });
  }

  return {
    categoryId,
    name,
    slug,
    brand,
    shortDescription,
    specSheetUrl: specSheetUrl || null,
    active,
    variants: parsedVariants,
    technicalSpecs,
    images,
  } as const;
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoriesError) return { error: describeDbError("No se pudieron validar las categorías", categoriesError) };
  if (!resolveCategory(categories ?? [], parsed.categoryId)) {
    return { error: "La categoría seleccionada ya no existe. Recarga la página." };
  }

  const skus = parsed.variants.map((variant) => variant.sku);
  const taken = await findTakenSkus(supabase, skus);
  const duplicate = skus.find((sku) => taken.has(sku));
  if (duplicate) {
    return { error: `Ya existe una variante con el código (SKU) "${duplicate}".` };
  }

  const input: ProductWriteInput = {
    categoryId: parsed.categoryId,
    name: parsed.name,
    slug: parsed.slug,
    brand: parsed.brand,
    shortDescription: parsed.shortDescription,
    specSheetUrl: parsed.specSheetUrl,
    technicalSpecs: parsed.technicalSpecs,
    images: parsed.images,
    active: parsed.active,
    variants: parsed.variants.map(({ sku, label, price, compareAtPrice, stock }) => ({
      sku,
      label,
      price,
      compareAtPrice,
      stock,
    })),
  };

  const result = await createProductRecord(supabase, input);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ProductActionResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoriesError) return { error: describeDbError("No se pudieron validar las categorías", categoriesError) };
  if (!resolveCategory(categories ?? [], parsed.categoryId)) {
    return { error: "La categoría seleccionada ya no existe. Recarga la página." };
  }

  const skus = parsed.variants.map((variant) => variant.sku);
  const taken = await findTakenSkus(supabase, skus);
  const duplicate = skus.find((sku) => taken.get(sku) && taken.get(sku) !== id);
  if (duplicate) {
    return { error: `Ya existe una variante con el código (SKU) "${duplicate}" en otro producto.` };
  }

  const input: ProductWriteInput = {
    categoryId: parsed.categoryId,
    name: parsed.name,
    slug: parsed.slug,
    brand: parsed.brand,
    shortDescription: parsed.shortDescription,
    specSheetUrl: parsed.specSheetUrl,
    technicalSpecs: parsed.technicalSpecs,
    images: parsed.images,
    active: parsed.active,
    variants: parsed.variants.map(({ sku, label, price, compareAtPrice, stock }) => ({
      sku,
      label,
      price,
      compareAtPrice,
      stock,
    })),
  };

  const result = await updateProductRecord(supabase, id, input);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export interface BulkActivateResult {
  error?: string;
  activated?: number;
  skipped?: number;
  deactivated?: number;
}

// Desactivar en lote no tiene condición: cualquier producto puede
// ocultarse de la tienda sin importar si tiene imagen. Activar en lote
// respeta la misma regla que ya aplica al activar uno por uno desde el
// formulario manual (parseProductForm: "Agrega al menos una imagen para
// poder activar el producto") — los que no tienen se omiten en vez de
// fallar todo el lote, y el resumen final dice cuántos se omitieron y por
// qué.
export async function bulkSetProductsActive(
  ids: string[],
  active: boolean
): Promise<BulkActivateResult> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "No autorizado." };
  if (ids.length === 0) return { error: "No hay productos seleccionados." };

  if (!active) {
    const { error } = await supabase.from("products").update({ active: false }).in("id", ids);
    if (error) return { error: describeDbError("No se pudieron desactivar los productos", error) };
    revalidatePath("/admin/productos");
    return { deactivated: ids.length };
  }

  const { data, error } = await supabase.from("products").select("id, images").in("id", ids);
  if (error) return { error: describeDbError("No se pudieron validar los productos", error) };

  const eligibleIds = (data ?? [])
    .filter((product) => (product.images?.length ?? 0) > 0)
    .map((product) => product.id);
  const skipped = ids.length - eligibleIds.length;

  if (eligibleIds.length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ active: true })
      .in("id", eligibleIds);
    if (updateError) return { error: describeDbError("No se pudieron activar los productos", updateError) };
  }

  revalidatePath("/admin/productos");
  return { activated: eligibleIds.length, skipped };
}
