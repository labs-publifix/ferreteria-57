import type { ImportColumnDef } from "@/lib/importTemplates/columnDefs";
import type { PartnerInput } from "./normalize";

// Columnas de la carga masiva del directorio de socios: la misma definición
// genera la plantilla descargable y la lee el importador (y el generador del
// seed), para que no puedan desincronizarse. `key` es el encabezado ya
// normalizado (sin acentos, minúsculas) contra el que se compara el archivo.
export const PARTNER_COLUMNS = [
  { key: "nombre_comercial", header: "NOMBRE_COMERCIAL", required: true, example: "Taller Ejemplo Querétaro", format: "Texto. Nombre con el que se conoce el negocio (de 2 a 120 caracteres)." },
  { key: "giro", header: "GIRO", required: false, example: "Taller automotriz", format: "Texto. Debe coincidir con un giro del catálogo; si no existe, se crea. «Por definir» o vacío: el socio queda pendiente y no se publica." },
  { key: "contacto", header: "CONTACTO", required: false, example: "Juan Pérez López", format: "Texto. Persona de contacto." },
  { key: "telefono", header: "TELEFONO", required: false, example: "4421234567", format: "10 dígitos. Se quitan espacios, guiones y la lada 52 o 521." },
  { key: "correo", header: "CORREO", required: false, example: "contacto@ejemplo.com", format: "Correo válido. Se guarda en minúsculas." },
  { key: "correo_2", header: "CORREO_2", required: false, example: "", format: "Segundo correo (opcional)." },
  { key: "calle", header: "CALLE", required: false, example: "Av. Constituyentes", format: "Texto." },
  { key: "num_ext", header: "NUM_EXT", required: false, example: "100", format: "Número exterior. «S/N» si no tiene." },
  { key: "num_int", header: "NUM_INT", required: false, example: "", format: "Número interior (opcional)." },
  { key: "colonia", header: "COLONIA", required: false, example: "Centro", format: "Texto." },
  { key: "cp", header: "CP", required: false, example: "76000", format: "5 dígitos." },
  { key: "municipio", header: "MUNICIPIO", required: false, example: "Querétaro", format: "Texto. Por ejemplo Querétaro, Corregidora o El Marqués." },
  { key: "estado", header: "ESTADO", required: false, example: "Querétaro", format: "Texto. Si se deja vacío se guarda «Querétaro»." },
  { key: "logo_url", header: "LOGO_URL", required: false, example: "", format: "Opcional. Enlace https a una imagen PNG, JPG, WebP o SVG de hasta 2 MB; se copia al sitio. Vacío: avatar con iniciales." },
  { key: "clave_origen", header: "CLAVE_ORIGEN", required: false, example: "", format: "Opcional. Clave del socio en tu sistema; sirve para reconocerlo en cargas futuras." },
  { key: "notas", header: "NOTAS", required: false, example: "", format: "Notas internas. Solo las ve el personal en el panel, nunca se publican." },
  { key: "consentimiento", header: "CONSENTIMIENTO", required: false, example: "SI", format: "SI si el socio autorizó compartir sus datos de contacto con los miembros de Club 57 (LFPDPPP); NO o vacío si todavía no." },
] as const satisfies readonly ImportColumnDef[];

export type PartnerColumnKey = (typeof PARTNER_COLUMNS)[number]["key"] & keyof PartnerInput;

/** Encabezados alternos aceptados (normalizados) → columna. */
export const PARTNER_COLUMN_ALIASES: Record<string, PartnerColumnKey> = {
  giro_sugerido: "giro",
  nombre: "nombre_comercial",
  "correo 2": "correo_2",
  "num ext": "num_ext",
  "num int": "num_int",
  "codigo postal": "cp",
  notas_internas: "notas",
  consentimiento_datos: "consentimiento",
};
