import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Único lugar que consulta "¿este código ya existe?" — usado antes de
// insertar tanto desde el formulario manual (createProduct/updateProduct)
// como desde el importador de Excel (que necesita saberlo ANTES de tocar
// la base, para poder mostrar la vista previa). Devuelve el product_id
// dueño de cada SKU ya tomado, no solo un booleano: el importador lo
// necesita para poder ofrecer "actualizar el producto existente" en vez de
// solo bloquear la fila.
export async function findTakenSkus(
  supabase: SupabaseServerClient,
  skus: string[]
): Promise<Map<string, string>> {
  const uniqueSkus = [...new Set(skus.filter((sku) => sku.trim().length > 0))];
  if (uniqueSkus.length === 0) return new Map();

  const { data, error } = await supabase
    .from("product_variants")
    .select("sku, product_id")
    .in("sku", uniqueSkus);

  if (error) throw new Error(error.message);

  const taken = new Map<string, string>();
  for (const row of data ?? []) {
    taken.set(row.sku, row.product_id);
  }
  return taken;
}
