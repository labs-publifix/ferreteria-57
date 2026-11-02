// Directorio completo para miembros activos de Club 57 (pestaña «Socios
// Comerciales» de /cuenta). Los datos llegan de club57_directorio_miembros(),
// que valida la membresía en la base y solo trae el contacto de los socios
// que autorizaron compartirlo (datos_autorizados).

export interface MemberPartner {
  id: string;
  nombre_comercial: string;
  slug: string;
  giro_id: string;
  giro: string;
  logo_url: string | null;
  datos_autorizados: boolean;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  correo_2: string | null;
  calle: string | null;
  num_ext: string | null;
  num_int: string | null;
  colonia: string | null;
  cp: string | null;
  municipio: string | null;
  estado: string | null;
}

export type SociosCuenta =
  | { acceso: "miembro"; socios: MemberPartner[]; error: boolean }
  | { acceso: "sin_membresia" };

/** «Calle 47 Av 4 S/N, Int. 2, Lomas de Casa Blanca, 76080, Querétaro, Querétaro». */
export function direccionCompleta(partner: MemberPartner): string | null {
  const calle = [partner.calle, partner.num_ext].filter(Boolean).join(" ");
  const partes = [
    calle || null,
    partner.num_int ? `Int. ${partner.num_int}` : null,
    partner.colonia,
    partner.cp ? `C.P. ${partner.cp}` : null,
    partner.municipio,
    partner.estado,
  ].filter(Boolean);
  return calle ? partes.join(", ") : null;
}

export function telefonoLegible(telefono: string): string {
  return telefono.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
}

export function telefonoHref(telefono: string): string {
  return `tel:+52${telefono}`;
}

export function whatsappHref(telefono: string, nombre: string): string {
  const texto = `Hola, te encontré en el directorio de socios de Ferretería 57 (Club 57). Me interesa información de ${nombre}.`;
  return `https://wa.me/52${telefono}?text=${encodeURIComponent(texto)}`;
}

export function mapsHref(direccion: string, nombre: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nombre}, ${direccion}`)}`;
}
