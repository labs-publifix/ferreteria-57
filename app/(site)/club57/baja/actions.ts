"use server";

import { cambiarSuscripcionAvisos, type ResultadoBaja } from "@/lib/club57/avisos/baja";

// Página pública de baja: sin sesión, la firma del enlace es la
// autorización (ver lib/club57/avisos/token.ts).
export async function darDeBajaAvisos(m: string, t: string): Promise<ResultadoBaja> {
  return cambiarSuscripcionAvisos(m, t, true);
}

export async function reactivarAvisos(m: string, t: string): Promise<ResultadoBaja> {
  return cambiarSuscripcionAvisos(m, t, false);
}
