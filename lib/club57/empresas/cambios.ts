import { diaCorteLabel, nominaLabel, type Convenio } from "./datos";

const money = (n: number | null) =>
  n === null ? "sin definir" : `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Resumen legible de lo que cambió en el convenio, para la bitácora. */
export function describirCambiosConvenio(antes: Convenio, despues: Convenio): string[] {
  const cambios: string[] = [];
  if (antes.limite_credito !== despues.limite_credito) {
    cambios.push(`Límite de crédito: ${money(antes.limite_credito)} → ${money(despues.limite_credito)}`);
  }
  if (antes.dia_corte !== despues.dia_corte) {
    cambios.push(`Corte: ${diaCorteLabel(antes.dia_corte)} → ${diaCorteLabel(despues.dia_corte)}`);
  }
  if (antes.plazo_pago_dias !== despues.plazo_pago_dias) {
    cambios.push(`Plazo de pago: ${antes.plazo_pago_dias ?? "—"} → ${despues.plazo_pago_dias ?? "—"} días`);
  }
  if (antes.plazo_autorizacion_dias !== despues.plazo_autorizacion_dias) {
    cambios.push(`Plazo para autorizar: ${antes.plazo_autorizacion_dias} → ${despues.plazo_autorizacion_dias} días hábiles`);
  }
  if (antes.exige_numero_empleado !== despues.exige_numero_empleado) {
    cambios.push(`Número de empleado: ${despues.exige_numero_empleado ? "obligatorio" : "opcional"}`);
  }
  const nominaAntes = nominaLabel(antes.nomina_frecuencia, antes.nomina_dia_semana, antes.nomina_dia_mes);
  const nominaDespues = nominaLabel(despues.nomina_frecuencia, despues.nomina_dia_semana, despues.nomina_dia_mes);
  if (nominaAntes !== nominaDespues) cambios.push(`Nómina: ${nominaAntes} → ${nominaDespues}`);
  if (antes.descuentos_por_compra !== despues.descuentos_por_compra) {
    cambios.push(`Descuentos por compra: ${antes.descuentos_por_compra} → ${despues.descuentos_por_compra}`);
  }
  if (antes.politica_porcentaje !== despues.politica_porcentaje) {
    cambios.push(`Línea general: ${antes.politica_porcentaje ?? "—"} % → ${despues.politica_porcentaje ?? "—"} % del salario`);
  }
  return cambios;
}

