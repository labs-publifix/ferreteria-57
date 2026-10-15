// Compartido entre el historial de puntos del admin
// (lealtad/clientes/[id]) y el panel del propio cliente (/cuenta) — mismo
// texto para el mismo tipo de movimiento en ambos lados.
export const CLUB57_TIPO_LABEL: Record<string, string> = {
  compra_online: "Compra en línea",
  compra_manual: "Compra en tienda",
  referido_bono: "Bono por referido",
  reversion_cancelacion: "Reversión por cancelación",
  canje: "Canje",
};

export const CLUB57_REDEMPTION_ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente de entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// Quién dio de alta a un cliente de Club 57, para la columna «Vendedor» y
// el detalle del admin. creado_por_vendedor_id solo se llena cuando el alta
// la hizo un vendedor; un alta desde el panel de admin y el registro en
// línea lo dejan vacío (ver 20260927010000_club57_vendedor_role.sql).
export function club57VendedorLabel(
  origenAlta: "vendedor" | "autoregistro",
  vendedorId: string | null,
  vendedorNombre: string | null | undefined
): string {
  if (vendedorId) return vendedorNombre?.trim() || "Vendedor sin nombre";
  return origenAlta === "autoregistro" ? "Sin vendedor · registro en línea" : "Sin vendedor · alta desde el panel";
}
