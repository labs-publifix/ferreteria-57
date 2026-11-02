import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { loadPartnerWorkbook, parsePartnerWorkbook } from "@/lib/club57/socios/excel";
import { clasificarFilas, IMPORT_MAX_BYTES, IMPORT_MAX_ROWS, type ExistingPartner } from "@/lib/club57/socios/import";

// Paso 1 de la carga masiva: lee el Excel/CSV y devuelve la vista previa
// (cada fila válida, con advertencia o con error, y sus duplicados). No
// escribe nada. Ruta y no Server Action porque el archivo puede pasar de
// 1 MB. El middleware no cubre /api/admin/*: el rol se valida aquí.
export async function POST(request: Request) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("archivo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Elige un archivo .xlsx o .csv." }, { status: 400 });
  const nombre = file.name.toLowerCase();
  if (!nombre.endsWith(".xlsx") && !nombre.endsWith(".csv")) {
    return NextResponse.json({ error: "El archivo debe ser .xlsx o .csv." }, { status: 400 });
  }
  if (file.size > IMPORT_MAX_BYTES) return NextResponse.json({ error: "El archivo pesa más de 4 MB." }, { status: 413 });

  let parsed;
  try {
    parsed = parsePartnerWorkbook(await loadPartnerWorkbook(Buffer.from(await file.arrayBuffer()), file.name));
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. Revisa que sea un Excel (.xlsx) o CSV válido." }, { status: 400 });
  }
  if (!parsed) {
    return NextResponse.json(
      { error: "No encontramos la columna NOMBRE_COMERCIAL. Usa la plantilla o revisa los encabezados." },
      { status: 400 }
    );
  }
  if (parsed.rows.length === 0) return NextResponse.json({ error: "El archivo no trae filas con datos." }, { status: 400 });
  if (parsed.rows.length > IMPORT_MAX_ROWS) {
    return NextResponse.json({ error: `Máximo ${IMPORT_MAX_ROWS} filas por archivo; divídelo en partes.` }, { status: 400 });
  }

  const [{ data: existentes, error }, { data: giros }] = await Promise.all([
    staff.supabase.from("club57_partners").select("id, nombre_comercial, telefono, correo, correo_2, calle, clave_origen"),
    staff.supabase.from("club57_partner_giros").select("nombre"),
  ]);
  if (error) return NextResponse.json({ error: "No se pudo consultar el directorio." }, { status: 500 });

  const preview = clasificarFilas(
    parsed.rows,
    (existentes ?? []) as ExistingPartner[],
    (giros ?? []).map((giro) => giro.nombre as string)
  );
  return NextResponse.json({ sheetName: parsed.sheetName, ...preview });
}
