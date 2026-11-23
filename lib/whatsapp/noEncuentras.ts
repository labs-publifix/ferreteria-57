import { STORE_WHATSAPP_PHONE } from "@/lib/store-info";

// «¿No encuentras tu producto? Escríbenos por WhatsApp»: el enlace abre
// WhatsApp con el mensaje ya escrito según dónde está la persona (lo que
// buscó, la categoría que veía o, si es colaborador, su empresa), para que
// la ferretería sepa qué conseguir.

export const NO_ENCUENTRAS_TITULO = "¿No encuentras tu producto?";
export const NO_ENCUENTRAS_TEXTO = "Tenemos acceso a más de 15,000 productos Truper. Escríbenos y te lo conseguimos.";

export interface NoEncuentrasContexto {
  busqueda?: string;
  categoria?: string;
  empresa?: string;
}

const limpiar = (texto: string) => texto.replace(/\s+/g, " ").trim().slice(0, 120);

export function mensajeNoEncuentras({ busqueda, categoria, empresa }: NoEncuentrasContexto): string {
  const partes = ["Hola, no encuentro un producto en la tienda en línea."];
  if (busqueda && limpiar(busqueda)) partes.push(`Busqué: «${limpiar(busqueda)}».`);
  else if (categoria && limpiar(categoria)) partes.push(`Estaba viendo la categoría ${limpiar(categoria)}.`);
  if (empresa && limpiar(empresa)) partes.push(`Soy colaborador de ${limpiar(empresa)} (Club 57 Empresarial).`);
  partes.push("¿Me ayudan a conseguirlo?");
  return partes.join(" ");
}

export function noEncuentrasWhatsAppUrl(contexto: NoEncuentrasContexto = {}): string {
  return `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(mensajeNoEncuentras(contexto))}`;
}
