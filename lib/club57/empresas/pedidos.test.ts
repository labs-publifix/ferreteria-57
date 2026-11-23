import { describe, expect, it } from "vitest";
import { estadoPedidoEmpresaLabel, RESOLUCION_PEDIDO_LABEL, ultimoDiaPlazo } from "./pedidos";
import { getAvailableNextStatuses, isValidStatusTransition, orderStatusLabel } from "@/lib/orders/status";

describe("pedidos con cargo a empresa", () => {
  it("muestra como último día el anterior al vencimiento (00:00 CDMX)", () => {
    // 2 de diciembre 00:00 en CDMX = 06:00 UTC → último día: martes 1 de diciembre.
    expect(ultimoDiaPlazo("2026-12-02T06:00:00Z")).toBe("martes, 1 de diciembre");
  });

  it("etiqueta resoluciones y estados de entrega", () => {
    expect(RESOLUCION_PEDIDO_LABEL.vencido).toBe("Venció sin autorizar");
    expect(estadoPedidoEmpresaLabel("pagado")).toBe("Autorizado, por preparar");
    expect(estadoPedidoEmpresaLabel("pendiente_autorizacion")).toBe("En espera de autorización");
  });

  it("en el panel, un pedido en espera de la empresa solo se puede cancelar", () => {
    expect(getAvailableNextStatuses("pendiente_autorizacion", "pickup")).toEqual(["cancelado"]);
    expect(isValidStatusTransition("pendiente_autorizacion", "pagado", "pickup")).toBe(false);
    expect(isValidStatusTransition("pendiente_autorizacion", "entregado", "foraneo")).toBe(false);
    expect(isValidStatusTransition("pendiente_autorizacion", "cancelado", "local_delivery")).toBe(true);
  });

  it("un pedido con cargo a empresa ya autorizado se muestra como «Autorizado»", () => {
    expect(orderStatusLabel("pagado", "empresa")).toBe("Autorizado");
    expect(orderStatusLabel("pagado", "mercadopago")).toBe("Pagado");
    expect(orderStatusLabel("preparando", "empresa")).toBe("Preparando");
  });
});
