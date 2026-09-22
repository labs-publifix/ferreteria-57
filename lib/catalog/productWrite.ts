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
  clave: string | null;
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
      clave: input.clave,
      short_description: input.shortDescription,
      spec_sheet_url: input.specSheetUrl,
      technical_specs: input.technicalSpecs,
      images: input.images,
      active: input.active,
      activated_at: input.active ? new Date().toISOString() : null,
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

// Actualiza en el lugar las variantes que coinciden por SKU (conserva su
// id) en vez de borrar todas e insertarlas de nuevo con ids nuevos — usado
// solo por la edición manual completa (el admin ve y controla cada
// presentación en pantalla). La actualización disparada desde el
// importador usa updateProductFromImportRow en su lugar — ver la nota ahí
// sobre por qué NO comparte esta función.
//
// Antes, CUALQUIER edición del producto (incluso solo cambiar la
// descripción) borraba y recreaba TODAS sus variantes. Como
// order_items.variant_id referencia product_variants.id con
// "on delete set null" (ver 20260919010000_stock_and_cancel.sql), eso
// dejaba huérfanos los renglones de pedidos YA HECHOS que compraron esa
// presentación — rompiendo, entre otras cosas, la restauración de stock
// al cancelar esos pedidos. Se detectó al investigar 3 líneas huérfanas en
// un pedido de prueba (limpieza pre-lanzamiento) cuyo SKU seguía existiendo
// con un variant_id distinto al que el pedido tenía guardado.
export async function updateProductRecord(
  supabase: SupabaseServerClient,
  productId: string,
  input: ProductWriteInput
): Promise<{ error?: string }> {
  // Solo se toca activated_at cuando esta edición es la que de verdad pasa
  // el producto de inactivo a activo — guardar un producto que YA estaba
  // activo (solo se editó su descripción, por ejemplo) no debe "reactivar"
  // la fecha, o la métrica de "activados en los últimos 7 días" contaría
  // cualquier edición como si fuera una activación nueva.
  const { data: current } = await supabase
    .from("products")
    .select("active")
    .eq("id", productId)
    .single();
  const justActivated = input.active && !(current?.active ?? false);

  const { error: productError } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug,
      brand: input.brand,
      clave: input.clave,
      short_description: input.shortDescription,
      spec_sheet_url: input.specSheetUrl,
      technical_specs: input.technicalSpecs,
      images: input.images,
      active: input.active,
      updated_at: new Date().toISOString(),
      ...(justActivated ? { activated_at: new Date().toISOString() } : {}),
    })
    .eq("id", productId);

  if (productError) {
    return { error: describeDbError("No se pudo actualizar el producto", productError) };
  }

  const { data: existingVariants, error: existingError } = await supabase
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);
  if (existingError) {
    return { error: describeDbError("No se pudieron leer las presentaciones actuales", existingError) };
  }

  const existingIdBySku = new Map((existingVariants ?? []).map((v) => [v.sku, v.id]));
  const incomingSkus = new Set(input.variants.map((variant) => variant.sku));

  // Presentaciones que de verdad desaparecieron del formulario (SKU ya no
  // está en el input) — a esas sí les toca borrarse; sus pedidos ya hechos
  // quedan con variant_id nulo, pero es el caso correcto (la presentación
  // en sí se eliminó), no un efecto secundario de editar otra cosa.
  const removedIds = (existingVariants ?? [])
    .filter((v) => !incomingSkus.has(v.sku))
    .map((v) => v.id);
  if (removedIds.length > 0) {
    const { error } = await supabase.from("product_variants").delete().in("id", removedIds);
    if (error) {
      return { error: describeDbError("No se pudieron actualizar las presentaciones", error) };
    }
  }

  const toInsert = input.variants
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => !existingIdBySku.has(variant.sku));
  if (toInsert.length > 0) {
    const { error } = await supabase.from("product_variants").insert(
      toInsert.map(({ variant, index }) => ({
        product_id: productId,
        sku: variant.sku,
        label: variant.label,
        price: variant.price,
        compare_at_price: variant.compareAtPrice,
        stock: variant.stock,
        position: index,
      }))
    );
    if (error) {
      return { error: describeDbError("No se pudieron guardar las presentaciones", error) };
    }
  }

  // Las que sí ya existían (mismo SKU) se actualizan sobre su fila
  // original — conserva su id, y por lo tanto cualquier
  // order_items.variant_id que ya la referencie.
  for (const [index, variant] of input.variants.entries()) {
    const existingId = existingIdBySku.get(variant.sku);
    if (!existingId) continue;
    const { error } = await supabase
      .from("product_variants")
      .update({
        label: variant.label,
        price: variant.price,
        compare_at_price: variant.compareAtPrice,
        stock: variant.stock,
        position: index,
      })
      .eq("id", existingId);
    if (error) {
      return { error: describeDbError("No se pudieron actualizar las presentaciones", error) };
    }
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
