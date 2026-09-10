"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: parsed.categoryId,
      name: parsed.name,
      slug: parsed.slug,
      brand: parsed.brand,
      short_description: parsed.shortDescription,
      spec_sheet_url: parsed.specSheetUrl,
      technical_specs: parsed.technicalSpecs,
      images: parsed.images,
      active: parsed.active,
    })
    .select("id")
    .single();

  if (productError || !product) {
    if (productError?.code === "23505") {
      return { error: "Ya existe un producto con ese slug." };
    }
    return { error: "No se pudo crear el producto." };
  }

  const { error: variantsError } = await supabase.from("product_variants").insert(
    parsed.variants.map((variant, index) => ({
      product_id: product.id,
      sku: variant.sku,
      label: variant.label,
      price: variant.price,
      compare_at_price: variant.compareAtPrice,
      stock: variant.stock,
      position: index,
    }))
  );

  if (variantsError) {
    // El producto ya se creó pero sus variantes no — se borra para no
    // dejar un producto sin ninguna presentación, un estado que la app
    // no espera en ningún otro lugar (ProductCard asume variants[0]).
    await supabase.from("products").delete().eq("id", product.id);
    if (variantsError.code === "23505") {
      return { error: "Ya existe una variante con ese código (SKU)." };
    }
    return { error: "No se pudieron guardar las presentaciones." };
  }

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

  const { error: productError } = await supabase
    .from("products")
    .update({
      category_id: parsed.categoryId,
      name: parsed.name,
      slug: parsed.slug,
      brand: parsed.brand,
      short_description: parsed.shortDescription,
      spec_sheet_url: parsed.specSheetUrl,
      technical_specs: parsed.technicalSpecs,
      images: parsed.images,
      active: parsed.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (productError) {
    if (productError.code === "23505") {
      return { error: "Ya existe un producto con ese slug." };
    }
    return { error: "No se pudo actualizar el producto." };
  }

  // Reemplaza todas las variantes en vez de calcular un diff (agregar,
  // quitar, actualizar una por una): más simple y siempre queda
  // consistente con lo que el formulario muestra. Si algún carrito
  // guardado apuntaba a una variante que ya no existe, CartProvider ya la
  // descarta solo al recargar (mismo comportamiento que un producto
  // eliminado) — no es un caso nuevo que este admin tenga que resolver.
  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", id);
  if (deleteError) return { error: "No se pudieron actualizar las presentaciones." };

  const { error: insertError } = await supabase.from("product_variants").insert(
    parsed.variants.map((variant, index) => ({
      product_id: id,
      sku: variant.sku,
      label: variant.label,
      price: variant.price,
      compare_at_price: variant.compareAtPrice,
      stock: variant.stock,
      position: index,
    }))
  );

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "Ya existe una variante con ese código (SKU)." };
    }
    return { error: "No se pudieron guardar las presentaciones." };
  }

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
