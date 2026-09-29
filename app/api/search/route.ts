import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/catalog/searchRateLimit";
import { mapSearchRow, SEARCH_RESULT_LIMIT, type SearchResultItem } from "@/lib/catalog/search";

// Endpoint detrás del desplegable en vivo del Header (y de /buscar) en vez
// de llamar a supabase.rpc('search_products', ...) directo desde el
// navegador — así el límite de resultados y el rate limit quedan
// impuestos aquí, del lado del servidor, sin depender de que el cliente
// los respete.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ results: [] satisfies SearchResultItem[] });
  }

  // x-forwarded-for trae "ip_cliente, proxy1, proxy2, ..." — el primero es
  // el visitante real. Sin esa cabecera (dev local, algunos runtimes) cae
  // a un solo cubo compartido: sigue limitando el TOTAL de tráfico aunque
  // no distinga por IP.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas búsquedas, espera un momento." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_products", {
    p_query: query,
    // Nunca el límite que mande el cliente: search_products() ya lo topa
    // a 50 en el propio RPC, pero aquí se fija al valor real que usa la
    // interfaz (8) para que este endpoint nunca pueda usarse para volcar
    // más catálogo del que el desplegable necesita.
    p_limit: SEARCH_RESULT_LIMIT,
  });

  if (error) {
    console.error("[api/search]", error.message);
    return NextResponse.json({ error: "No se pudo buscar en este momento." }, { status: 500 });
  }

  return NextResponse.json({ results: (data ?? []).map(mapSearchRow) });
}
