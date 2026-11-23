import { NextResponse, type NextRequest } from "next/server";
import { buildImportTemplate } from "@/lib/importTemplates/buildTemplate";
import { EMPLEADOS_PRECARGA_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";

export const dynamic = "force-dynamic";

// Plantilla de precarga de empleados del Portal Empresa (solo el
// responsable de una empresa activa o suspendida).
export async function GET(request: NextRequest) {
  const { empresa } = await getPortalEmpresa();
  if (!empresa) return NextResponse.redirect(new URL("/cuenta?next=/empresa/empleados", request.url));

  const buffer = await buildImportTemplate({
    columns: EMPLEADOS_PRECARGA_COLUMNS,
    sheetName: "Empleados",
    instructionsTitle: `Precarga de empleados — ${empresa.nombre_comercial}`,
    extraNotes: [
      "Quien se registre en Club 57 con el código de tu empresa y coincida por correo o número de empleado quedará aprobado con la línea de este archivo.",
      "Las solicitudes que ya estén en revisión y coincidan se aprueban al cargar el archivo.",
      "Cada carga reemplaza la lista anterior de empleados que todavía no se han registrado.",
    ],
  });
  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-empleados-club57.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
