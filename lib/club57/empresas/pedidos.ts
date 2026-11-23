// Club 57 Empresarial · pedidos con cargo a la empresa — utilidades puras
// compartidas por el portal, la cuenta del empleado y el panel.

export type ResolucionPedidoEmpresa =
  | "autorizado"
  | "rechazado"
  | "cancelado_empleado"
  | "vencido"
  | "baja_empleado"
  | "baja_empresa"
  | "cancelado_tienda";

export const RESOLUCION_PEDIDO_LABEL: Record<string, string> = {
  autorizado: "Autorizado",
  rechazado: "Rechazado",
  cancelado_empleado: "Cancelado por el colaborador",
  vencido: "Venció sin autorizar",
  baja_empleado: "Cancelado por baja del colaborador",
  baja_empresa: "Cancelado por baja de la empresa",
  cancelado_tienda: "Cancelado por Ferretería 57",
};

const ENTREGA_LABEL: Record<string, string> = {
  pendiente_autorizacion: "En espera de autorización",
  pagado: "Autorizado, por preparar",
  preparando: "Preparando",
  listo: "Listo",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Estado del pedido visto desde la empresa o el empleado (no hay «pagado»: se autorizó). */
export function estadoPedidoEmpresaLabel(status: string): string {
  return ENTREGA_LABEL[status] ?? status;
}

const formatoDia = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Mexico_City",
});

/**
 * Último día para autorizar. El plazo se guarda como el instante en que
 * vence (00:00 del día siguiente, hora del centro de México), así que se
 * muestra el día anterior a ese instante.
 */
export function ultimoDiaPlazo(venceAt: string): string {
  return formatoDia.format(new Date(new Date(venceAt).getTime() - 60_000));
}
