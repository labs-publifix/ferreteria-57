import { normalizeText } from "@/lib/normalizeText";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

// Único lugar donde se decide "a qué categoría real corresponde este
// valor" — usado por el formulario manual (donde el valor ya es un id real
// tomado del <select>, así que solo confirma que sigue existiendo) y por
// el importador de Excel (donde el valor es texto libre como "Mecanica" o
// "Iluminacion " que hay que emparejar contra el nombre real de la
// categoría). Nunca crea categorías nuevas — si no encuentra coincidencia,
// devuelve null y quien llama decide qué hacer con eso.
export function resolveCategory(
  categories: CategoryOption[],
  rawValue: string
): CategoryOption | null {
  const value = rawValue.trim();
  if (!value) return null;

  const byId = categories.find((category) => category.id === value);
  if (byId) return byId;

  const normalized = normalizeText(value);
  return (
    categories.find(
      (category) => normalizeText(category.name) === normalized || normalizeText(category.slug) === normalized
    ) ?? null
  );
}
