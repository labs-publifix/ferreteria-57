// Registro de artículos del blog: dice si un tema del backlog ya tiene
// artículo y cuándo se publica (o publicó).
//
// FASE 1: todavía no existen artículos, así que getRegistryEntry devuelve
// undefined para todo y cada tema queda "pendiente" (o "descartado").
// FASE 3 lo conectará con los artículos reales (misma firma).
import type { RegistryEntry } from "./types";

const DIA_MS = 86_400_000;

// TODO(Fase 3): retirar BLOG_ADMIN_MOCK junto con este bloque cuando el
// registro se conecte con los artículos reales.
//
// Solo para revisar visualmente los 3 estados en un preview: con
// BLOG_ADMIN_MOCK=1, B01–B03 salen publicados y B04–B05 programados. Nunca
// aplica en la producción real de Vercel (VERCEL_ENV=production).
export function isBlogAdminMockActive(): boolean {
  return process.env.BLOG_ADMIN_MOCK === "1" && process.env.VERCEL_ENV !== "production";
}

function mockEntry(topicId: string, now: Date): RegistryEntry | undefined {
  const publicados: Record<string, number> = { B01: -3, B02: -2, B03: -1 };
  const programados: Record<string, number> = { B04: 2, B05: 5 };
  const dias = publicados[topicId] ?? programados[topicId];
  if (dias === undefined) return undefined;
  return { publishAt: new Date(now.getTime() + dias * DIA_MS).toISOString() };
}

export function getRegistryEntry(topicId: string, now: Date = new Date()): RegistryEntry | undefined {
  if (isBlogAdminMockActive()) return mockEntry(topicId, now);
  return undefined;
}
