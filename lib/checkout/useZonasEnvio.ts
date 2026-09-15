"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FORANEO_KEY, NO_LISTADA_KEY, PICKUP_TIENDA_KEY } from "./constants";

export interface ZonaEnvio {
  colonia: string;
  costoEnvioMxn: number;
}

const SPECIAL_KEYS = new Set<string>([PICKUP_TIENDA_KEY, NO_LISTADA_KEY, FORANEO_KEY]);

// Trae las colonias reales de zonas_envio (excluye las 3 filas especiales,
// ver lib/checkout/constants.ts) una sola vez al montar — mismo patrón que
// ProductCatalogProvider: fetch del lado del cliente porque el checkout
// completo es "use client" y no hay ninguna sesión que requerir para
// cotizar un envío. isLoaded distingue "todavía cargando" de "ya se
// intentó y no hay nada", para que el combobox no muestre "sin resultados"
// de más mientras el fetch sigue en curso.
export function useZonasEnvio() {
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("zonas_envio")
          .select("colonia, costo_envio_mxn")
          .order("colonia", { ascending: true });
        if (error) console.error("[useZonasEnvio]", error.message);
        if (cancelled) return;
        const rows = (data ?? [])
          .filter((row) => !SPECIAL_KEYS.has(row.colonia))
          .map((row) => ({ colonia: row.colonia, costoEnvioMxn: Number(row.costo_envio_mxn) }));
        setZonas(rows);
      } catch {
        // Sin catálogo de zonas (red caída, tabla sin migrar todavía): el
        // combobox se degrada a "sin colonias" — sigue disponible la
        // opción "Mi colonia no aparece en la lista" para no bloquear el
        // checkout por completo.
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { zonas, isLoaded };
}
