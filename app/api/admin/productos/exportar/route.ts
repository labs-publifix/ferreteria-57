import { NextResponse, type NextRequest } from "next/server";
import {
  buildProductExportRows,
  buildProductExportWorkbook,
  productExportFilename,
  type ExportProductSource,
} from "@/lib/catalog/productExport";
import { requireStaff } from "@/lib/supabase/requireStaff";

// Exportar a Excel TODO el catálogo (activos e inactivos), sin importar los
// filtros que estén aplicados en /admin/productos. Mismo control de acceso
// que la plantilla del importador: el middleware solo protege "/admin/*",
// así que esta ruta verifica la sesión por su cuenta (admin y operador).

export const dynamic = "force-dynamic";

// La API entrega máximo 1,000 filas por consulta: se pagina para que la
// exportación siga completa cuando el catálogo crezca.
const PAGE_SIZE = 1000;

export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const products: ExportProductSource[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await staff.supabase
      .from("products")
      .select("name, active, featured, categories(name), product_variants(sku, label, price, stock)")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      return new NextResponse(`No se pudieron leer los productos: ${error.message}`, { status: 500 });
    }
    products.push(...((data ?? []) as unknown as ExportProductSource[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const buffer = await buildProductExportWorkbook(buildProductExportRows(products));

  return new NextResponse(new Blob([new Uint8Array(buffer)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${productExportFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}
