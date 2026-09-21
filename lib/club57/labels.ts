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
