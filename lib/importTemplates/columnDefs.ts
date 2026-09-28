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
      "Texto — código/SKU único del producto. Si ya existe un producto con este código, la fila se ofrece para actualizar precio en vez de crear uno nuevo.",
  },
  {
    key: "nombre",
    header: "Nombre",
    required: true,
    example: "Martillo de Carpintero 16oz",
    format: "Texto libre — la marca se detecta sola a partir del nombre, no hace falta una columna aparte.",
  },
  {
    key: "precio",
    header: "Precio",
    required: true,
    example: "150.00",
    format: "Número — usa punto o coma como separador decimal. No incluyas el símbolo $ ni separadores de miles.",
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
