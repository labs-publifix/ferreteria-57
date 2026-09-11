import { createClient } from "@/lib/supabase/server";

export interface Category {
  id: string;
  /** Coincide con el segmento final de `href` y con `Product.categoryId`
   *  en el catálogo real — es la llave que usa /categoria/[slug] y la
   *  búsqueda para resolver una categoría, en vez de parsear `href`. */
  slug: string;
  label: string;
  href: string;
  /** Nombre del ícono de lucide-react (ver lib/category-icons.ts). */
  icon: string;
}

// Antes un arreglo estático; ahora lee la tabla real de Supabase — el
// Header y el Home (que la consumen como prop, ver app/(site)/layout.tsx
// y app/(site)/page.tsx) no cambiaron de forma, solo de dónde sale el
// dato. Solo categorías activas y en el orden que definió el admin
// (position); las inactivas no deben aparecer en el mega-menú ni en el
// grid de categorías del Home.
export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, icon")
    .eq("active", true)
    .order("position", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.name,
    href: `/categoria/${row.slug}`,
    icon: row.icon,
  }));
}
