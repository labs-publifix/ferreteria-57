import type { createClient } from "@/lib/supabase/server";
import type { TechnicalSpec } from "@/types/catalog";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface VariantWriteInput {
  sku: string;
  label: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export interface ProductWriteInput {
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  specSheetUrl: string | null;
  technicalSpecs: TechnicalSpec[];
  images: string[];
  active: boolean;
  variants: VariantWriteInput[];
}

// Muestra el mensaje real de Postgres/PostgREST en vez de uno genérico —
// esta pantalla solo la ve un admin ya autenticado. Único lugar que decide
// esto: lo usan tanto el formulario manual como el importador de Excel, así
// que un mismo tipo de error (código repetido, categoría inexistente) se
// explica igual sin importar por qué camino se creó el producto.
export function describeDbError(fallbackMessage: string, error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return error.message.includes("sku")
      ? "Ya existe una variante con ese código (SKU)."
      : "Ya existe un producto con ese slug.";
  }
  return `${fallbackMessage}: ${error.message}`;
}

// Único lugar que de verdad inserta un producto + sus variantes en la base
// — lo usan createProduct (formulario manual) y la importación de Excel
// (fila por fila). El objetivo explícito es que crear el mismo producto
// por cualquiera de los dos caminos deje exactamente el mismo registro.
export async function createProductRecord(
  supabase: SupabaseServerClient,
  input: ProductWriteInput
): Promise<{ id?: string; error?: string }> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug,
      brand: input.brand,
      short_description: input.shortDescription,
      spec_sheet_url: input.specSheetUrl,
      technical_specs: input.technicalSpecs,
      images: input.images,
      active: input.active,
    })
    .select("id")
    .single();

  if (productError || !product) {
    return {
      error: productError
        ? describeDbError("No se pudo crear el producto", productError)
        : "No se pudo crear el producto.",
    };
  }

  const { error: variantsError } = await supabase.from("product_variants").insert(
    input.variants.map((variant, index) => ({
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
    // dejar un producto sin ninguna presentación, un estado que la app no
    // espera en ningún otro lugar (ProductCard asume variants[0]).
    await supabase.from("products").delete().eq("id", product.id);
    return { error: describeDbError("No se pudieron guardar las presentaciones", variantsError) };
  }

  return { id: product.id };
}

// Reemplaza todas las variantes en vez de calcular un diff: usado solo por
// la edición manual completa (el admin ve y controla cada presentación en
// pantalla). La actualización disparada desde el importador usa
// updateProductFromImportRow en su lugar — ver la nota ahí sobre por qué
// NO comparte esta función.
export async function updateProductRecord(
  supabase: SupabaseServerClient,
  productId: string,
  input: ProductWriteInput
): Promise<{ error?: string }> {
  const { error: productError } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug,
      brand: input.brand,
      short_description: input.shortDescription,
      spec_sheet_url: input.specSheetUrl,
      technical_specs: input.technicalSpecs,
      images: input.images,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (productError) {
    return { error: describeDbError("No se pudo actualizar el producto", productError) };
  }

  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (deleteError) {
    return { error: describeDbError("No se pudieron actualizar las presentaciones", deleteError) };
  }

  const { error: insertError } = await supabase.from("product_variants").insert(
    input.variants.map((variant, index) => ({
      product_id: productId,
      sku: variant.sku,
      label: variant.label,
      price: variant.price,
      compare_at_price: variant.compareAtPrice,
      stock: variant.stock,
      position: index,
    }))
  );
  if (insertError) {
    return { error: describeDbError("No se pudieron guardar las presentaciones", insertError) };
  }

  return {};
}

export interface ImportUpdateInput {
  categoryId: string;
  name: string;
  brand: string;
  specSheetUrl: string | null;
  price: number;
  sku: string;
}

// Camino distinto (a propósito) de updateProductRecord: una fila del Excel
// solo trae categoría/nombre/marca/precio/URL de UN código — si un
// producto existente tiene varias presentaciones (como el taladro del
// ejemplo) y esta fila solo coincide con una de ellas, reemplazar TODAS
// las variantes borraría las demás presentaciones que el Excel ni siquiera
// menciona. Por eso aquí solo se actualiza el precio de la variante cuyo
// SKU coincidió, dejando stock y el resto de presentaciones intactos.
export async function updateProductFromImportRow(
  supabase: SupabaseServerClient,
  productId: string,
  input: ImportUpdateInput
): Promise<{ error?: string }> {
  const { error: productError } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      brand: input.brand,
      spec_sheet_url: input.specSheetUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (productError) {
    return { error: describeDbError("No se pudo actualizar el producto", productError) };
  }

  const { error: variantError } = await supabase
    .from("product_variants")
    .update({ price: input.price })
    .eq("product_id", productId)
    .eq("sku", input.sku);
  if (variantError) {
    return { error: describeDbError("No se pudo actualizar el precio", variantError) };
  }

  return {};
}
