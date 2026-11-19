import ExcelJS from "exceljs";

// Exportación del catálogo completo (activos e inactivos) a Excel desde
// /admin/productos. La consulta vive en app/api/admin/productos/exportar;
// aquí solo el armado de filas y del libro, como funciones puras para
// probarlas sin base.

export interface ExportProductSource {
  name: string;
  active: boolean;
  featured: boolean;
  categories: { name: string } | { name: string }[] | null;
  product_variants: { sku: string; label: string | null; price: number | string; stock: number }[];
}

export interface ProductExportRow {
  codigo: string;
  producto: string;
  categoria: string;
  precio: number;
  stock: number;
  estado: "Activo" | "Inactivo";
  destacado: "Sí" | "No";
}

export const PRODUCT_EXPORT_HEADERS = ["Código", "Producto", "Categoría", "Precio", "Stock", "Estado", "Destacado"] as const;

const LABEL_UNICO = "único";

function categoryName(categories: ExportProductSource["categories"]): string {
  const category = Array.isArray(categories) ? categories[0] : categories;
  return category?.name ?? "Sin categoría";
}

/**
 * Una fila por código: el código (SKU) es de cada presentación, no del
 * producto, así que un producto con varias presentaciones sale en varias
 * filas, cada una con su precio y su stock, y el nombre lleva la
 * presentación para distinguirlas. Orden por código, con los numéricos en
 * orden natural (29010 antes de 100000).
 */
export function buildProductExportRows(products: ExportProductSource[]): ProductExportRow[] {
  const rows: ProductExportRow[] = [];
  for (const product of products) {
    const variants = product.product_variants ?? [];
    const multiple = variants.length > 1;
    for (const variant of variants) {
      const label = (variant.label ?? "").trim();
      const showLabel = multiple && label && label.toLowerCase() !== LABEL_UNICO;
      rows.push({
        codigo: variant.sku.trim(),
        producto: showLabel ? `${product.name} — ${label}` : product.name,
        categoria: categoryName(product.categories),
        precio: Number(variant.price),
        stock: variant.stock,
        estado: product.active ? "Activo" : "Inactivo",
        destacado: product.featured ? "Sí" : "No",
      });
    }
  }
  return rows.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true, sensitivity: "base" }));
}

export async function buildProductExportWorkbook(rows: ProductExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ferretería 57";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Productos", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    // El código va como texto: así nunca pierde ceros a la izquierda ni se
    // convierte en número con formato raro, y se puede cruzar tal cual con
    // el importador.
    { header: PRODUCT_EXPORT_HEADERS[0], key: "codigo", width: 14, style: { numFmt: "@" } },
    { header: PRODUCT_EXPORT_HEADERS[1], key: "producto", width: 60 },
    { header: PRODUCT_EXPORT_HEADERS[2], key: "categoria", width: 26 },
    { header: PRODUCT_EXPORT_HEADERS[3], key: "precio", width: 13, style: { numFmt: '"$"#,##0.00' } },
    { header: PRODUCT_EXPORT_HEADERS[4], key: "stock", width: 9, style: { numFmt: "0" } },
    { header: PRODUCT_EXPORT_HEADERS[5], key: "estado", width: 11 },
    { header: PRODUCT_EXPORT_HEADERS[6], key: "destacado", width: 11 },
  ];

  for (const row of rows) sheet.addRow(row);

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3F515A" } };
  header.alignment = { vertical: "middle" };
  header.height = 20;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: PRODUCT_EXPORT_HEADERS.length } };

  // exceljs trae su propio tipo Buffer (ver importar/actions.ts); en tiempo
  // de ejecución es el Buffer de Node.
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Nombre del archivo con la fecha de la tienda: productos-ferreteria57-2026-11-19.xlsx */
export function productExportFilename(now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return `productos-ferreteria57-${day}.xlsx`;
}
