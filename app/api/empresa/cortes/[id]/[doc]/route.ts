import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FACTURAS_BUCKET, mapCicloLinea, type EstadoCiclo } from "@/lib/club57/empresas/cortes";
import { renderEstadoCuentaPdf } from "@/lib/club57/empresas/estadoCuentaPdf";
import { excelDetalleCorte, excelNominaCorte } from "@/lib/club57/empresas/estadoCuentaExcel";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Documentos de un corte de Club 57 Empresarial: estado de cuenta (PDF),
// Excel para nómina, Excel de detalle y la factura registrada (PDF/XML).
// Solo el responsable de la empresa o el personal de Ferretería 57: la base
// lo valida (RLS de club57_ciclos y club57_ciclo_detalle).
export async function GET(request: NextRequest, { params }: { params: { id: string; doc: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/cuenta?next=/empresa/cortes", request.url));

  const { data: ciclo } = await supabase
    .from("club57_ciclos")
    .select(
      "id, periodo_inicio, periodo_fin, estado, factura_folio, factura_fecha, factura_pdf_path, factura_xml_path, pago_vence, pago_fecha, club57_empresas(nombre_comercial, razon_social, rfc)"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!ciclo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const empresaRaw = ciclo.club57_empresas as unknown;
  const empresa = (Array.isArray(empresaRaw) ? empresaRaw[0] : empresaRaw) as { nombre_comercial: string; razon_social: string; rfc: string | null };
  const base = `corte-${ciclo.periodo_fin}`;

  if (params.doc === "factura-pdf" || params.doc === "factura-xml") {
    const path = params.doc === "factura-pdf" ? ciclo.factura_pdf_path : ciclo.factura_xml_path;
    if (!path) return NextResponse.json({ error: "Sin archivo" }, { status: 404 });
    const { data } = await createAdminClient().storage.from(FACTURAS_BUCKET).createSignedUrl(path as string, 60, {
      download: `factura-${ciclo.factura_folio ?? base}.${params.doc === "factura-pdf" ? "pdf" : "xml"}`,
    });
    if (!data?.signedUrl) return NextResponse.json({ error: "No se pudo descargar" }, { status: 500 });
    return NextResponse.redirect(data.signedUrl);
  }

  const { data: detalle, error } = await supabase.rpc("club57_ciclo_detalle", { p_ciclo_id: params.id });
  if (error) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const lineas = ((detalle ?? []) as Record<string, unknown>[]).map(mapCicloLinea);
  const total = Math.round(lineas.reduce((sum, l) => sum + l.total, 0) * 100) / 100;

  if (params.doc === "pdf") {
    const bytes = await renderEstadoCuentaPdf({
      empresa,
      ciclo: {
        periodo_inicio: ciclo.periodo_inicio as string,
        periodo_fin: ciclo.periodo_fin as string,
        estado: ciclo.estado as EstadoCiclo,
        factura_folio: ciclo.factura_folio as string | null,
        factura_fecha: ciclo.factura_fecha as string | null,
        pago_vence: ciclo.pago_vence as string | null,
        pago_fecha: ciclo.pago_fecha as string | null,
      },
      lineas,
      total,
    });
    return new NextResponse(new Blob([bytes as BlobPart]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="estado-de-cuenta-${base}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const comun = { empresa: empresa.nombre_comercial, periodoInicio: ciclo.periodo_inicio as string, periodoFin: ciclo.periodo_fin as string, lineas };
  if (params.doc === "nomina" || params.doc === "detalle") {
    const buffer = params.doc === "nomina" ? await excelNominaCorte({ ...comun, total }) : await excelDetalleCorte(comun);
    return new NextResponse(new Blob([buffer]), {
      headers: {
        "Content-Type": XLSX,
        "Content-Disposition": `attachment; filename="${params.doc === "nomina" ? "nomina" : "detalle"}-${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return NextResponse.json({ error: "Documento desconocido" }, { status: 404 });
}
