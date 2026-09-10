// Genera el slug inicial a partir del nombre en los formularios de
// categoría/producto del admin — el campo queda editable después, esto
// solo evita que el admin tenga que escribirlo a mano cada vez.
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    // Quita las marcas diacríticas que normalize() separó del carácter
    // base (á -> a + acento, ñ -> n + virgulilla, etc.) usando el rango
    // Unicode de marcas combinables vía escape \u, no el caracter
    // literal (evita cualquier problema de encoding al guardar el archivo).
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
