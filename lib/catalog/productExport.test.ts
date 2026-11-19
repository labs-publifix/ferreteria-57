import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildProductExportRows,
  buildProductExportWorkbook,
  PRODUCT_EXPORT_HEADERS,
  productExportFilename,
  type ExportProductSource,
} from "./productExport";

const base: ExportProductSource = {
  name: "Martillo de uña",
  active: true,
  featured: false,
  categories: { name: "Herramienta" },
  product_variants: [{ sku: "29010", label: "Único", price: "189.50", stock: 7 }],
};

describe("buildProductExportRows", () => {
  it("arma una fila por código con los datos del producto", () => {
    expect(buildProductExportRows([base])).toEqual([
      { codigo: "29010", producto: "Martillo de uña", categoria: "Herramienta", precio: 189.5, stock: 7, estado: "Activo", destacado: "No" },
    ]);
  });

  it("incluye inactivos y destacados con su etiqueta", () => {
    const [row] = buildProductExportRows([{ ...base, active: false, featured: true }]);
    expect(row.estado).toBe("Inactivo");
    expect(row.destacado).toBe("Sí");
  });

  it("separa las presentaciones de un mismo producto en filas con su propio precio y stock", () => {
    const rows = buildProductExportRows([
      {
        ...base,
        name: "Cinta teflón",
        product_variants: [
          { sku: "27169", label: "1/2 pulgada", price: 25, stock: 40 },
          { sku: "27170", label: "3/4 pulgada", price: 32, stock: 0 },
        ],
      },
    ]);
    expect(rows.map((row) => [row.codigo, row.producto, row.precio, row.stock])).toEqual([
      ["27169", "Cinta teflón — 1/2 pulgada", 25, 40],
      ["27170", "Cinta teflón — 3/4 pulgada", 32, 0],
    ]);
  });

  it("ordena por código en orden natural y marca la categoría faltante", () => {
    const rows = buildProductExportRows([
      { ...base, product_variants: [{ sku: "100000", label: null, price: 1, stock: 1 }] },
      { ...base, categories: null, product_variants: [{ sku: "29073", label: null, price: 1, stock: 1 }] },
      { ...base, categories: [{ name: "Plomería" }], product_variants: [{ sku: "27169", label: null, price: 1, stock: 1 }] },
    ]);
    expect(rows.map((row) => row.codigo)).toEqual(["27169", "29073", "100000"]);
    expect(rows[1].categoria).toBe("Sin categoría");
    expect(rows[0].categoria).toBe("Plomería");
  });

  it("no exporta productos sin presentaciones", () => {
    expect(buildProductExportRows([{ ...base, product_variants: [] }])).toEqual([]);
  });
});

describe("buildProductExportWorkbook", () => {
  it("genera el Excel con los encabezados, el código como texto y el precio como número", async () => {
    const buffer = await buildProductExportWorkbook(buildProductExportRows([base]));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet("Productos")!;
    expect((sheet.getRow(1).values as unknown[]).slice(1)).toEqual([...PRODUCT_EXPORT_HEADERS]);
    expect(sheet.getCell("A2").value).toBe("29010");
    expect(sheet.getCell("D2").value).toBe(189.5);
    expect(sheet.getCell("E2").value).toBe(7);
    expect(sheet.getCell("F2").value).toBe("Activo");
  });
});

describe("productExportFilename", () => {
  it("usa la fecha de la tienda", () => {
    expect(productExportFilename(new Date("2026-11-20T03:00:00Z"))).toBe("productos-ferreteria57-2026-11-19.xlsx");
  });
});
