import { stripAccents } from "@/lib/normalizeText";

// Genera el slug inicial a partir del nombre en los formularios de
// categoría/producto del admin — el campo queda editable después, esto
// solo evita que el admin tenga que escribirlo a mano cada vez.
export function slugify(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
