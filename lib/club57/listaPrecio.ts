// Etiquetas de la lista de precio asignada a un miembro de Club 57. Solo
// para el personal: al miembro nunca se le muestra el número de lista, solo
// «Tu precio Club 57».

export const LISTA_PRECIO_OPCIONES: { value: number | null; label: string }[] = [
  { value: null, label: "Precio de tienda" },
  { value: 1, label: "Precio 1" },
  { value: 2, label: "Precio 2" },
  { value: 3, label: "Precio 3" },
  { value: 4, label: "Precio 4" },
];

export function listaPrecioLabel(lista: number | null | undefined): string {
  return lista ? `Precio ${lista}` : "Precio de tienda";
}

/** Valor del filtro ?lista= del listado de clientes. */
export type ListaPrecioFiltro = "todas" | "con" | "sin" | "1" | "2" | "3" | "4";

export function parseListaPrecioFiltro(value: string | undefined): ListaPrecioFiltro {
  return value === "con" || value === "sin" || value === "1" || value === "2" || value === "3" || value === "4"
    ? value
    : "todas";
}
