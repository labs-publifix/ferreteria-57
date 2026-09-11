import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar producto — Panel de administración" };

export default async function AdminEditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from("categories").select("id, name").order("position"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, slug, brand, short_description, spec_sheet_url, technical_specs, images, active, product_variants(id, sku, label, price, compare_at_price, stock, position)"
      )
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  if (!product) notFound();

  const variants = (product.product_variants ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      label: variant.label,
      price: String(variant.price),
      compareAtPrice: variant.compare_at_price != null ? String(variant.compare_at_price) : "",
      stock: String(variant.stock),
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        Editar producto
      </h1>
      <ProductForm
        mode="edit"
        productId={product.id}
        categories={categories ?? []}
        initialValues={{
          categoryId: product.category_id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          shortDescription: product.short_description ?? "",
          specSheetUrl: product.spec_sheet_url ?? "",
          active: product.active,
          variants:
            variants.length > 0
              ? variants
              : [{ sku: "", label: "Único", price: "", compareAtPrice: "", stock: "" }],
          technicalSpecs: product.technical_specs ?? [],
          images: product.images ?? [],
        }}
      />
    </div>
  );
}
