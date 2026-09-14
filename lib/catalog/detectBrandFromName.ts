import { normalizeText } from "@/lib/normalizeText";

// Familia real de submarcas de Grupo Truper (no "Expert", que nunca fue una
// submarca del grupo). Se usa tanto en el formulario manual (sugiere Marca
// al terminar de escribir Nombre) como en el importador de Excel (pre-llena
// la columna Marca por fila) y en los filtros de "Marca" de tienda/admin —
// una sola función para que los tres caminos detecten exactamente lo mismo.
export const KNOWN_BRANDS = [
  "Truper",
  "Pretul",
  "Foset",
  "Volteck",
  "Fiero",
  "Hermex",
  "Klintek",
] as const;

export function detectBrandFromName(name: string): string {
  const normalized = normalizeText(name);
  const match = KNOWN_BRANDS.find((brand) => normalized.includes(normalizeText(brand)));
  return match ?? "Truper";
}
