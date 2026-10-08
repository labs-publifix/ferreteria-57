import { GUIDE_SOURCES } from "@/content/blog/_guides";
import { buildGuides, type GuideData } from "./guide-schema";

// Carga y valida todas las guías PDF al importar el módulo (igual que
// lib/blog/content.ts con los artículos): una guía inválida rompe el build.
// Solo servidor: la importan la ruta de descarga, la vista previa del
// admin y /cuenta.
const GUIDES: GuideData[] = buildGuides(GUIDE_SOURCES);

export function getAllGuides(): GuideData[] {
  return GUIDES;
}

export function getGuideBySlug(slug: string): GuideData | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
