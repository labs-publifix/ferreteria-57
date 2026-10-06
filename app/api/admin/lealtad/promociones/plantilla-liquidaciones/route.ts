import { NextResponse, type NextRequest } from "next/server";
import { buildImportTemplate } from "@/lib/importTemplates/buildTemplate";
import { LIQUIDACIONES_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { requireStaff } from "@/lib/supabase/requireStaff";

// Plantilla del Excel de Liquidaciones del Mes — mismo patrón que las
// plantillas de productos y del catálogo de canje (el middleware no cubre
// "/api/admin/*", así que se verifica aquí).
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const buffer = await buildImportTemplate({
    columns: LIQUIDACIONES_COLUMNS,
    sheetName: "Hoja1",
    instructionsTitle: "Plantilla — Liquidaciones del Mes (Club 57)",
    extraNotes: [
      "Cada fila es un producto. El PDF se genera en el mismo orden de las filas y con las descripciones tal cual.",
      "En el PDF se imprimen Codigos, Cantidad (como Piezas), Descripcion y Costo con impuesto (como precio de liquidación).",
      "Las filas con Cantidad 0 también se imprimen: si un producto no debe aparecer, bórralo del Excel.",
    ],
  });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-liquidaciones.xlsx"',
    },
  });
}
