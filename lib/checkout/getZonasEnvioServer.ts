import { createClient } from "@/lib/supabase/server";
import { FORANEO_KEY, NO_LISTADA_KEY, PICKUP_TIENDA_KEY } from "./constants";
import type { ZonaEnvio } from "./useZonasEnvio";

const SPECIAL_KEYS = new Set<string>([PICKUP_TIENDA_KEY, NO_LISTADA_KEY, FORANEO_KEY]);

// Misma consulta y misma forma de dato que useZonasEnvio (hook de
// cliente), pero para el lado del servidor — la usa la Server Action de
// checkout para recalcular el costo de envío local de forma autoritativa,
// sin confiar en el número que ya traiga calculado el navegador.
export async function getZonasEnvioServer(): Promise<ZonaEnvio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("zonas_envio").select("colonia, costo_envio_mxn");
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => !SPECIAL_KEYS.has(row.colonia))
    .map((row) => ({ colonia: row.colonia, costoEnvioMxn: Number(row.costo_envio_mxn) }));
}
