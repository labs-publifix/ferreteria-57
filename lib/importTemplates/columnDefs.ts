// #8 (descargar plantilla): fuente única de verdad para las columnas de
// los 3 flujos de carga masiva por Excel — antes cada Server Action de
// importación traía su propio `COLUMNS`/`UPDATE_COLUMNS` inline (solo el
// nombre de la columna, sin required/formato/ejemplo). Se extraen aquí
// como objetos más ricos para que el generador de plantillas
// (lib/importTemplates/buildTemplate.ts) y el parseo de cada importador
// lean exactamente la misma definición — nunca puede haber una columna en
// la plantilla que el importador no reconozca, o viceversa.
export interface ImportColumnDef {
  /** Encabezado normalizado (sin acentos/espacios/mayúsculas) contra el
   *  que cada importador matchea la columna real del archivo subido. */
  key: string;
  /** Encabezado tal cual se escribe en la plantilla descargable. */
  header: string;
  required: boolean;
  /** Valor de ejemplo para la(s) fila(s) de ejemplo de la plantilla. */
  example: string;
  /** Descripción en lenguaje llano para la hoja "Instrucciones". */
  format: string;
}

export const PRODUCT_CREATE_COLUMNS = [
  {
    key: "categoria",
    header: "Categoria",
    required: true,
    example: "Herramientas Manuales",
    format:
      "Texto — debe coincidir con el nombre de una categoría que ya exista en la tienda (no distingue mayúsculas ni acentos). Ver la hoja Instrucciones para la lista vigente.",
  },
  {
    key: "codigo",
    header: "Codigo",
    required: true,
    example: "MAR-100",
    format:
      "Texto — código/SKU único del producto. Si ya existe un producto con este código, la fila se ofrece para actualizar sus precios en vez de crear uno nuevo.",
  },
  {
    key: "nombre",
    header: "Nombre",
    required: true,
    example: "Martillo de Carpintero 16oz",
    format: "Texto libre — la marca se detecta sola a partir del nombre, no hace falta una columna aparte.",
  },
  {
    key: "precio 1",
    header: "Precio 1",
    required: true,
    example: "150.00",
    format:
      "Número mayor a 0 — usa punto como separador decimal, sin el símbolo $ ni separadores de miles. Es la lista más alta de Truper.",
  },
  {
    key: "precio 2",
    header: "Precio 2",
    required: false,
    example: "138.00",
    format: "Número mayor a 0. Opcional: si se deja vacío se usará el Precio 1.",
  },
  {
    key: "precio 3",
    header: "Precio 3",
    required: false,
    example: "126.00",
    format: "Número mayor a 0. Opcional: si se deja vacío se usará el Precio 1.",
  },
  {
    key: "precio 4",
    header: "Precio 4",
    required: false,
    example: "104.00",
    format: "Número mayor a 0. Opcional: si se deja vacío se usará el Precio 1.",
  },
  {
    key: "url",
    header: "URL",
    required: false,
    example: "https://ejemplo.com/ficha-tecnica.pdf",
    format: "Texto — enlace a la ficha técnica en PDF. Opcional, se puede dejar vacío.",
  },
] as const satisfies readonly ImportColumnDef[];

export const PRODUCT_UPDATE_COLUMNS = [
  {
    key: "codigo",
    header: "Codigo",
    required: true,
    example: "MAR-100",
    format:
      "Texto — debe coincidir EXACTO con el código de un producto ya existente. Solo se usa para encontrarlo, esta plantilla nunca lo modifica.",
  },
  {
    key: "clave",
    header: "Clave",
    required: false,
    example: "CLA-2045",
    format: "Texto — el único campo que esta plantilla actualiza. Déjalo vacío para borrar la clave existente.",
  },
] as const satisfies readonly ImportColumnDef[];

export const CLUB57_CATALOG_COLUMNS = [
  {
    key: "codigos",
    header: "Codigos",
    required: false,
    example: "68069",
    format:
      "Texto — código numérico del fabricante (Truper), usado solo para localizar la imagen del artículo. Nunca se muestra al cliente.",
  },
  {
    key: "clave",
    header: "Clave",
    required: false,
    example: "CLA-3050",
    format: "Texto libre, opcional.",
  },
  {
    key: "descripcion",
    header: "Descripcion",
    required: true,
    example: "Taladro inalámbrico 12V",
    format: "Texto — nombre y descripción del artículo del catálogo de canje.",
  },
  {
    key: "costos",
    header: "Costos",
    required: true,
    example: "450.00",
    format:
      "Número — costo en pesos del artículo. Se usa para calcular los puntos requeridos según la configuración vigente de Club 57 (editable fila por fila antes de importar).",
  },
] as const satisfies readonly ImportColumnDef[];

// Liquidaciones del Mes (Club 57): el Excel es la fuente de verdad del PDF
// que descargan los miembros. Mismo formato que el archivo que ya usa el
// equipo; "Existencias" y "Costo sin impuesto" se aceptan pero no se
// imprimen en el PDF.
export const LIQUIDACIONES_COLUMNS = [
  {
    key: "codigos",
    header: "Codigos",
    required: true,
    example: "26400",
    format: "Texto o número — código del producto. Se imprime en el PDF.",
  },
  {
    key: "descripcion",
    header: "Descripcion",
    required: true,
    example: "Pulidora 10' 110W, PRETUL",
    format: "Texto — se imprime tal cual en el PDF.",
  },
  {
    key: "cantidad",
    header: "Cantidad",
    required: true,
    example: "2",
    format: "Número entero (0 o más) — piezas disponibles. Se imprime en el PDF como \"Piezas\".",
  },
  {
    key: "existencias",
    header: "Existencias",
    required: false,
    example: "Default",
    format: "Texto libre, uso interno. No se imprime en el PDF.",
  },
  {
    key: "costo sin impuesto",
    header: "Costo sin impuesto",
    required: false,
    example: "517.24",
    format: "Número, uso interno. No se imprime en el PDF.",
  },
  {
    key: "costo con impuesto",
    header: "Costo con impuesto",
    required: true,
    example: "600",
    format: "Número mayor a 0 — precio de liquidación con impuestos. Es el precio que se imprime en el PDF.",
  },
] as const satisfies readonly ImportColumnDef[];

// «Actualizar precios»: el mismo formato que la exportación de productos
// (Código, Producto, Categoría, Precio 1–4, Stock, Estado, Destacado). Solo
// se leen Código y Precio 1–4; las demás columnas se ignoran.
export const PRICE_UPDATE_COLUMNS = [
  {
    key: "codigo",
    header: "Código",
    required: true,
    example: "10079",
    format: "Texto o número — debe coincidir EXACTO con el código (SKU) de una presentación que ya exista.",
  },
  {
    key: "producto",
    header: "Producto",
    required: false,
    example: "Martillo de uña 16 oz",
    format: "Solo de referencia, no se modifica.",
  },
  {
    key: "precio 1",
    header: "Precio 1",
    required: true,
    example: "180.00",
    format: "Número mayor a 0. Puede ser el resultado de una fórmula.",
  },
  {
    key: "precio 2",
    header: "Precio 2",
    required: true,
    example: "165.00",
    format: "Número mayor a 0. Puede ser el resultado de una fórmula.",
  },
  {
    key: "precio 3",
    header: "Precio 3",
    required: true,
    example: "150.00",
    format: "Número mayor a 0. Puede ser el resultado de una fórmula.",
  },
  {
    key: "precio 4",
    header: "Precio 4",
    required: true,
    example: "125.00",
    format: "Número mayor a 0. Puede ser el resultado de una fórmula.",
  },
] as const satisfies readonly ImportColumnDef[];

// Club 57 Empresarial: precarga de empleados desde el Portal Empresa.
export const EMPLEADOS_PRECARGA_COLUMNS = [
  { key: "nombre", header: "Nombre", required: false, example: "Rosa Díaz", format: "Texto, solo de referencia." },
  {
    key: "correo",
    header: "Correo",
    required: false,
    example: "rosa@empresa.mx",
    format: "El correo con el que el empleado se registrará en Club 57. Se pide el correo o el número de empleado.",
  },
  {
    key: "numero de empleado",
    header: "Número de empleado",
    required: false,
    example: "E-1024",
    format: "Tal como aparece en tu nómina. Obligatorio si tu empresa lo exige.",
  },
  {
    key: "salario mensual neto",
    header: "Salario mensual neto",
    required: false,
    example: "12000",
    format: "Número, sin $ ni comas. Obligatorio si la línea es un porcentaje. Solo lo ve tu empresa.",
  },
  {
    key: "linea",
    header: "Línea",
    required: true,
    example: "50%",
    format: "Porcentaje del salario (por ejemplo 50%) o monto fijo (por ejemplo 3000). Nunca más del salario.",
  },
] as const satisfies readonly ImportColumnDef[];
