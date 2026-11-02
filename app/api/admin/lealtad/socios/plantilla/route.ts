import { NextResponse, type NextRequest } from "next/server";
import { buildImportTemplate } from "@/lib/importTemplates/buildTemplate";
import { PARTNER_COLUMNS } from "@/lib/club57/socios/columns";
import { requireStaff } from "@/lib/supabase/requireStaff";

// Plantilla de la carga masiva del directorio de socios comerciales: los
// encabezados exactos que lee el importador (misma definición,
// lib/club57/socios/columns.ts), una fila de ejemplo y la hoja de
// instrucciones. El middleware no cubre /api/admin/*: se valida aquí.
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data: giros } = await staff.supabase
    .from("club57_partner_giros")
    .select("nombre")
    .eq("activo", true)
    .order("nombre");

  const buffer = await buildImportTemplate({
    columns: PARTNER_COLUMNS,
    sheetName: "Socios_Comerciales",
    instructionsTitle: "Plantilla — Directorio de socios comerciales (Club 57)",
    dropdowns: {
      giro: (giros ?? []).map((giro) => giro.nombre as string),
      consentimiento: ["SI", "NO"],
    },
    extraNotes: [
      "Solo NOMBRE_COMERCIAL es obligatorio. El resto se normaliza solo: teléfono a 10 dígitos (sin 52 ni 521), correos en minúsculas, textos en formato título y ESTADO «Querétaro» si se deja vacío.",
      "Antes de importar verás una vista previa: cada fila sale como válida, con advertencia o con error, con el motivo y su número de fila. Las filas con error no se importan.",
      "Duplicados: si una fila coincide con un socio que ya existe (misma CLAVE_ORIGEN, teléfono o correo, o mismo nombre comercial y calle), eliges si se omite o si se actualiza con los datos del archivo. Al actualizar, las celdas vacías no borran lo que ya está guardado.",
      "GIRO: si no existe en el catálogo se crea. «Por definir» o vacío deja al socio pendiente de completar: no se publica hasta asignarle un giro.",
      "NOTAS se guarda como notas internas: solo las ve el personal en el panel, nunca se publican.",
      "CONSENTIMIENTO: marca SI únicamente cuando el socio haya autorizado compartir sus datos de contacto con los miembros de Club 57. Sin esa autorización, los miembros ven al socio pero no su teléfono, correo ni dirección.",
      "LOGO_URL (opcional): enlace https directo a la imagen. Sin logo se usa el avatar con las iniciales del negocio; también se puede subir después desde la edición del socio.",
    ],
  });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-directorio-socios.xlsx"',
    },
  });
}
