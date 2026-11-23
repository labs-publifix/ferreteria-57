"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

// Precio Club 57 de quien tiene la sesión abierta. Las páginas del catálogo
// son las mismas para todos (y se guardan en caché), así que el precio del
// miembro se pide aparte, desde el navegador, solo para los productos que
// están en pantalla. La base nunca regresa el número de lista, solo el
// precio, y solo cuando le sale más barato que la tienda.

interface MemberPricesContextValue {
  /** true cuando ya se sabe si este visitante tiene precio Club 57. */
  isKnown: boolean;
  /** true si es miembro con lista asignada. */
  hasMemberPrices: boolean;
  /** Precio Club 57 de una presentación (undefined = paga el de tienda). */
  getMemberPrice: (variantId: string) => number | undefined;
  /** true si ya se consultaron todas estas presentaciones. */
  isResolved: (variantIds: string[]) => boolean;
  request: (variantIds: string[]) => void;
}

const MemberPricesContext = createContext<MemberPricesContextValue | null>(null);

const BATCH = 200;

export function MemberPricesProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [hasMemberPrices, setHasMemberPrices] = useState(false);
  const [checkedFor, setCheckedFor] = useState<string | null | undefined>(undefined);
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const requestedRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  // Cada cambio de sesión empieza de cero.
  useEffect(() => {
    if (isLoading) return;
    generationRef.current += 1;
    const generation = generationRef.current;
    requestedRef.current = new Set();
    queueRef.current = new Set();
    setPrices(new Map());
    setResolved(new Set());
    setHasMemberPrices(false);
    if (!userId) {
      setCheckedFor(null);
      return;
    }
    setCheckedFor(undefined);
    createClient()
      .rpc("tengo_precio_club57")
      .then(({ data, error }) => {
        if (generation !== generationRef.current) return;
        setHasMemberPrices(!error && data === true);
        setCheckedFor(userId);
      });
  }, [userId, isLoading]);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const ids = [...queueRef.current];
    queueRef.current = new Set();
    if (ids.length === 0) return;
    const generation = generationRef.current;
    const supabase = createClient();
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const { data, error } = await supabase.rpc("mis_precios_club57", { p_variant_ids: chunk });
      if (generation !== generationRef.current) return;
      if (error) {
        // Se vuelve a intentar en la siguiente petición; mientras, se
        // muestra el precio de tienda.
        for (const id of chunk) requestedRef.current.delete(id);
        continue;
      }
      const rows = (data ?? []) as { variant_id: string; precio: number | string }[];
      setPrices((current) => {
        const next = new Map(current);
        for (const row of rows) next.set(row.variant_id, Number(row.precio));
        return next;
      });
      setResolved((current) => {
        const next = new Set(current);
        for (const id of chunk) next.add(id);
        return next;
      });
    }
  }, []);

  const isKnown = !isLoading && checkedFor !== undefined;

  const request = useCallback(
    (variantIds: string[]) => {
      if (!hasMemberPrices) return;
      let added = false;
      for (const id of variantIds) {
        if (!id || requestedRef.current.has(id)) continue;
        requestedRef.current.add(id);
        queueRef.current.add(id);
        added = true;
      }
      if (added && !timerRef.current) timerRef.current = setTimeout(flush, 30);
    },
    [hasMemberPrices, flush]
  );

  const getMemberPrice = useCallback((variantId: string) => prices.get(variantId), [prices]);
  const isResolved = useCallback(
    (variantIds: string[]) => isKnown && (!hasMemberPrices || variantIds.every((id) => resolved.has(id))),
    [isKnown, hasMemberPrices, resolved]
  );

  const value = useMemo(
    () => ({ isKnown, hasMemberPrices, getMemberPrice, isResolved, request }),
    [isKnown, hasMemberPrices, getMemberPrice, isResolved, request]
  );

  return <MemberPricesContext.Provider value={value}>{children}</MemberPricesContext.Provider>;
}

// Fuera del sitio (vistas previas, pantallas sueltas) no hay precios Club 57:
// todo se muestra con el precio de tienda.
const SIN_PRECIOS: MemberPricesContextValue = {
  isKnown: true,
  hasMemberPrices: false,
  getMemberPrice: () => undefined,
  isResolved: () => true,
  request: () => undefined,
};

export function useMemberPricesContext() {
  return useContext(MemberPricesContext) ?? SIN_PRECIOS;
}

/**
 * Precios Club 57 de estas presentaciones. `ready` es false mientras se
 * consultan (el checkout espera a tenerlos para cobrar lo mismo que muestra).
 */
export function useMemberPrices(variantIds: string[]) {
  const { request, getMemberPrice, isResolved, hasMemberPrices } = useMemberPricesContext();
  const key = variantIds.join(",");
  useEffect(() => {
    if (key) request(key.split(","));
  }, [key, request]);
  return { getMemberPrice, ready: isResolved(variantIds), hasMemberPrices };
}
