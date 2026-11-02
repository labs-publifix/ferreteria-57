import { normalizeText } from "@/lib/normalizeText";

// Filtros del directorio sin dependencias de servidor: los usan /directorio
// (servidor) y la pestaña «Socios Comerciales» de /cuenta (navegador).

export interface GiroOption {
  id: string;
  nombre: string;
  total: number;
}

/** Giros con al menos un socio publicado, con su conteo, para el filtro. */
export function girosDe(partners: { giro_id: string; giro: string }[]): GiroOption[] {
  const byId = new Map<string, GiroOption>();
  for (const partner of partners) {
    const current = byId.get(partner.giro_id);
    if (current) current.total += 1;
    else byId.set(partner.giro_id, { id: partner.giro_id, nombre: partner.giro, total: 1 });
  }
  return [...byId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Búsqueda por nombre sin acentos ni mayúsculas, y filtro por giro. */
export function filtrarSocios<T extends { nombre_comercial: string; giro_id: string }>(
  partners: T[],
  q: string,
  giroId: string
): T[] {
  const needle = normalizeText(q);
  return partners.filter(
    (partner) =>
      (!giroId || partner.giro_id === giroId) && (!needle || normalizeText(partner.nombre_comercial).includes(needle))
  );
}

/**
 * Socios para el teaser del home: rota cada día (misma selección todo el
 * día, para que la página en caché no cambie a cada visita), con prioridad a
 * los que ya tienen logo.
 */
export function seleccionDelDia<T extends { id: string; logo_url: string | null }>(
  partners: T[],
  cantidad: number,
  fecha: string
): T[] {
  const seed = [...fecha].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
  const score = (id: string) => [...id].reduce((acc, char) => (acc * 33 + char.charCodeAt(0) + seed) >>> 0, seed);
  return [...partners]
    .sort((a, b) => Number(Boolean(b.logo_url)) - Number(Boolean(a.logo_url)) || score(a.id) - score(b.id))
    .slice(0, cantidad);
}
