"use server";

import { revalidatePath } from "next/cache";
import { isPriceList, type PriceList } from "@/lib/catalog/priceLevels";
import { requireFullAdmin } from "@/lib/supabase/requireStaff";

// Configuración → Precios: qué lista (Precio 1 a 4) ve el público. Solo el
// admin completo; la base lo vuelve a exigir en cada función.

export interface StoreListPreview {
  error?: string;
  listaActual?: PriceList;
  total?: number;
  suben?: number;
  bajan?: number;
  sinCambio?: number;
  ofertasOcultas?: number;
  cambioPromedioPct?: number;
}

export async function previewStoreList(lista: number): Promise<StoreListPreview> {
  const staff = await requireFullAdmin();
  if (!staff) return { error: "No autorizado." };
  if (!isPriceList(lista)) return { error: "Elige una lista del 1 al 4." };

  const { data, error } = await staff.supabase.rpc("vista_previa_lista_tienda", { p_lista: lista });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { error: `No se pudo calcular la vista previa${error ? `: ${error.message}` : "."}` };

  return {
    listaActual: row.lista_actual as PriceList,
    total: row.total,
    suben: row.suben,
    bajan: row.bajan,
    sinCambio: row.sin_cambio,
    ofertasOcultas: row.ofertas_ocultas,
    cambioPromedioPct: Number(row.cambio_promedio_pct),
  };
}

export interface ApplyStoreListResult {
  error?: string;
  listaAnterior?: PriceList;
  listaNueva?: PriceList;
  presentacionesCambiadas?: number;
}

export async function applyStoreList(lista: number): Promise<ApplyStoreListResult> {
  const staff = await requireFullAdmin();
  if (!staff) return { error: "No autorizado." };
  if (!isPriceList(lista)) return { error: "Elige una lista del 1 al 4." };

  const { data, error } = await staff.supabase.rpc("aplicar_lista_tienda", { p_lista: lista });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { error: `No se pudo cambiar la lista de tienda${error ? `: ${error.message}` : "."}` };

  // Los precios cambian en todo el sitio (inicio, categorías, fichas).
  revalidatePath("/", "layout");

  return {
    listaAnterior: row.lista_anterior as PriceList,
    listaNueva: row.lista_nueva as PriceList,
    presentacionesCambiadas: row.presentaciones_cambiadas,
  };
}
