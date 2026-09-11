import { normalizeText } from "@/lib/normalizeText";

// Las únicas marcas que maneja el catálogo hoy. Se usa tanto en el
// formulario manual (sugiere Marca al terminar de escribir Nombre) como en
// el importador de Excel (pre-llena la columna Marca por fila) — una sola
// función para que ambos caminos detecten exactamente lo mismo.
const KNOWN_BRANDS = ["Truper", "Pretul", "Expert"] as const;

export function detectBrandFromName(name: string): string {
  const normalized = normalizeText(name);
  const match = KNOWN_BRANDS.find((brand) => normalized.includes(normalizeText(brand)));
  return match ?? "Truper";
}
