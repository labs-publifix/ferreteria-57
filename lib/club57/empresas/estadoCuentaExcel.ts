import ExcelJS from "exceljs";
import { agruparPorEmpleado, detallePorProducto, periodoLabel, type CicloLinea } from "./cortes";

// Excel del corte de Club 57 Empresarial: para nómina (un renglón por
// colaborador) y detalle por producto.

function encabezado(ws: ExcelJS.Worksheet, titulo: string, subtitulo: string, columnas: string[]) {
  ws.addRow([titulo]).font = { bold: true, size: 13 };
  ws.addRow([subtitulo]);
  ws.addRow([]);
  const header = ws.addRow(columnas);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3F515A" } };
  });
}

export async function excelNominaCorte(input: {
  empresa: string;
  periodoInicio: string;
  periodoFin: string;
  lineas: CicloLinea[];
  total: number;
}): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ferretería 57";
  const ws = wb.addWorksheet("Nómina");
  encabezado(ws, `Club 57 Empresarial · ${input.empresa}`, `Corte ${periodoLabel(input.periodoInicio, input.periodoFin)}`, [
    "Número de empleado",
    "Nombre",
    "Número de pedidos",
    "Total",
  ]);
  for (const e of agruparPorEmpleado(input.lineas)) {
    ws.addRow([e.numero ?? "", e.nombre, e.pedidos.length, e.total]);
  }
  const ajustes = input.lineas.filter((l) => l.tipo === "ajuste");
  for (const a of ajustes) ws.addRow(["", a.concepto ?? "Saldo a favor", "", a.total]);
  ws.addRow(["", "Total del corte", "", input.total]).font = { bold: true };
  ws.columns.forEach((col, i) => {
    col.width = [20, 44, 20, 18][i] ?? 18;
  });
  ws.getColumn(4).numFmt = '"$"#,##0.00';
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export async function excelDetalleCorte(input: {
  empresa: string;
  periodoInicio: string;
  periodoFin: string;
  lineas: CicloLinea[];
}): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ferretería 57";
  const titulo = `Club 57 Empresarial · ${input.empresa}`;
  const subtitulo = `Corte ${periodoLabel(input.periodoInicio, input.periodoFin)}`;

  const porProducto = wb.addWorksheet("Por producto");
  encabezado(porProducto, titulo, subtitulo, ["SKU", "Producto", "Piezas", "Importe"]);
  for (const p of detallePorProducto(input.lineas)) porProducto.addRow([p.sku, p.producto, p.cantidad, p.importe]);
  porProducto.columns.forEach((col, i) => {
    col.width = [16, 56, 12, 18][i] ?? 16;
  });
  porProducto.getColumn(4).numFmt = '"$"#,##0.00';

  const porPedido = wb.addWorksheet("Por pedido");
  encabezado(porPedido, titulo, subtitulo, [
    "Pedido",
    "Fecha",
    "Número de empleado",
    "Empleado",
    "SKU",
    "Producto",
    "Piezas",
    "Precio unitario",
    "Importe",
  ]);
  for (const l of input.lineas) {
    if (l.tipo !== "pedido") continue;
    const fecha = new Date(l.fecha);
    for (const i of l.items) {
      porPedido.addRow([
        l.order_number,
        fecha,
        l.numero_empleado ?? "",
        l.empleado_nombre,
        i.sku,
        i.variant_label && i.variant_label !== "Único" ? `${i.product_name} (${i.variant_label})` : i.product_name,
        i.quantity,
        i.unit_price,
        i.quantity * i.unit_price,
      ]);
    }
    if ((l.shipping_cost ?? 0) > 0) {
      porPedido.addRow([l.order_number, fecha, l.numero_empleado ?? "", l.empleado_nombre, "", "Envío", 1, l.shipping_cost, l.shipping_cost]);
    }
  }
  porPedido.columns.forEach((col, i) => {
    col.width = [14, 14, 18, 30, 14, 48, 10, 16, 16][i] ?? 14;
  });
  porPedido.getColumn(2).numFmt = "dd/mm/yyyy";
  porPedido.getColumn(8).numFmt = '"$"#,##0.00';
  porPedido.getColumn(9).numFmt = '"$"#,##0.00';
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
