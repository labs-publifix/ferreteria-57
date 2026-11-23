import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getPortalEmpresa } from "@/lib/club57/empresas/portal";
import { agruparNominas, fechaNominaLabel, mapPortalDescuento } from "@/lib/club57/empresas/nomina";

export const dynamic = "force-dynamic";

// Excel de los descuentos de una nómina para cargarlos al sistema de
// nómina de la empresa (solo el responsable). ?fecha=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const { supabase, empresa } = await getPortalEmpresa();
  if (!empresa) return NextResponse.redirect(new URL("/cuenta?next=/empresa/nomina", request.url));
  const fecha = request.nextUrl.searchParams.get("fecha") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });

  const { data, error } = await supabase.rpc("club57_portal_descuentos");
  if (error) return NextResponse.json({ error: "No se pudo leer la nómina" }, { status: 500 });
  const descuentos = ((data ?? []) as Record<string, unknown>[]).map(mapPortalDescuento).filter((d) => d.fecha_nomina === fecha);
  const g = agruparNominas(descuentos, "9999-12-31");
  const nomina = g.porConfirmar[0] ?? g.historial[0];
  if (!nomina) return NextResponse.json({ error: "No hay descuentos en esa fecha" }, { status: 404 });
  const confirmada = nomina.estado !== "pendiente";

  const wb = new ExcelJS.Workbook();
  wb.creator = "Ferretería 57";
  const ws = wb.addWorksheet("Descuentos");
  ws.addRow([`Club 57 Empresarial · ${empresa.nombre_comercial}`]).font = { bold: true, size: 13 };
  ws.addRow([`Descuentos de la nómina del ${fechaNominaLabel(fecha)}`]);
  ws.addRow([]);
  const columnas = ["Número de empleado", "Nombre", "Correo", "Monto a descontar", ...(confirmada ? ["Monto aplicado"] : []), "Pedidos"];
  const header = ws.addRow(columnas);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3F515A" } };
  });
  for (const e of nomina.empleados) {
    ws.addRow([e.numero ?? "", e.nombre, e.correo, e.total, ...(confirmada ? [e.aplicado] : []), e.pedidos.join(", ")]);
  }
  const totalRow = ws.addRow(["", "Total", "", nomina.total, ...(confirmada ? [nomina.aplicado] : []), ""]);
  totalRow.font = { bold: true };
  ws.columns.forEach((col, i) => {
    col.width = [20, 32, 32, 18, confirmada ? 18 : 40, 40][i] ?? 18;
  });
  for (const c of [4, ...(confirmada ? [5] : [])]) ws.getColumn(c).numFmt = '"$"#,##0.00';

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="descuentos-nomina-${fecha}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
