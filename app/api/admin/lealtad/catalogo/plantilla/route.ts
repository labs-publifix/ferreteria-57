import { NextResponse, type NextRequest } from "next/server";
import { buildImportTemplate } from "@/lib/importTemplates/buildTemplate";
import { CLUB57_CATALOG_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { requireStaff } from "@/lib/supabase/requireStaff";

// #8 — plantilla del importador del catálogo de canje de Club 57. Mismo
// criterio de auth que app/api/admin/productos/plantilla/route.ts: el
// middleware no cubre "/api/admin/*", así que se verifica aquí.
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const buffer = await buildImportTemplate({
    columns: CLUB57_CATALOG_COLUMNS,
    sheetName: "Catálogo de canje",
    instructionsTitle: "Plantilla — Catálogo de canje Club 57",
    extraNotes: [
      "Los puntos requeridos NO se escriben aquí — se calculan solos a partir de Costos y la configuración vigente de Club 57 (monto por punto y tasa de canje), y se pueden ajustar fila por fila antes de confirmar la importación.",
      "Los artículos se crean inactivos y sin imagen — se activan y se les sube la foto desde el catálogo de canje después de importar.",
    ],
  });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-catalogo-canje.xlsx"',
    },
  });
}
