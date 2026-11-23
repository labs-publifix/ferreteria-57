// Club 57 Empresarial: validación de los datos de una empresa y de su
// convenio. La comparten el formulario público de afiliación y el panel de
// Ferretería 57, para que una empresa quede igual sin importar por dónde
// entró. Los CHECK de la tabla (migración 20261127010000) son la segunda
// capa.

export type EstadoEmpresa = "solicitud" | "activa" | "suspendida" | "baja" | "rechazada";
export type FrecuenciaNomina = "semanal" | "quincenal" | "mensual";

export const ESTADO_EMPRESA_LABEL: Record<EstadoEmpresa, string> = {
  solicitud: "Solicitud",
  activa: "Activa",
  suspendida: "Suspendida",
  baja: "Baja",
  rechazada: "Rechazada",
};

export const FRECUENCIA_LABEL: Record<FrecuenciaNomina, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function diaCorteLabel(dia: number | null | undefined): string {
  if (dia === null || dia === undefined) return "Sin definir";
  return dia === 0 ? "Último día del mes" : `Día ${dia} de cada mes`;
}

export function nominaLabel(
  frecuencia: FrecuenciaNomina | null | undefined,
  diaSemana: number | null | undefined,
  diaMes: number | null | undefined
): string {
  if (!frecuencia) return "Sin definir";
  if (frecuencia === "semanal") return `Semanal · cada ${(DIAS_SEMANA[(diaSemana ?? 5) - 1] ?? "viernes").toLowerCase()}`;
  if (frecuencia === "quincenal") return "Quincenal · días 15 y último de cada mes";
  return `Mensual · ${diaMes === 0 || diaMes === null || diaMes === undefined ? "último día del mes" : `día ${diaMes}`}`;
}

// --- Normalizadores -------------------------------------------------------

export function limpiar(value: unknown, max = 400): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizarRfc(value: unknown): string {
  return String(value ?? "").replace(/[\s-]/g, "").toUpperCase();
}

export function esRfcValido(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(rfc);
}

export function normalizarTelefono(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("52") ? digits.slice(2) : digits;
}

export function esCorreoValido(correo: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo);
}

function enteroOpcional(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

// --- Datos de la empresa (solicitud y panel) ------------------------------

export interface EmpresaDatosInput {
  razon_social: string;
  nombre_comercial: string;
  rfc: string;
  giro: string;
  num_empleados: string;
  regimen_fiscal: string;
  cp_fiscal: string;
  uso_cfdi: string;
  correo_facturas: string;
  domicilio_entrega: string;
  responsable_nombre: string;
  responsable_puesto: string;
  responsable_correo: string;
  responsable_telefono: string;
}

export interface EmpresaDatos {
  razon_social: string;
  nombre_comercial: string;
  rfc: string | null;
  giro: string | null;
  num_empleados: number | null;
  regimen_fiscal: string | null;
  cp_fiscal: string | null;
  uso_cfdi: string | null;
  correo_facturas: string | null;
  domicilio_entrega: string | null;
  responsable_nombre: string;
  responsable_puesto: string | null;
  responsable_correo: string;
  responsable_telefono: string | null;
}

export type Errores<K extends string> = Partial<Record<K, string>>;

/**
 * Valida y normaliza los datos de una empresa. `estricto` (formulario
 * público) exige RFC, datos fiscales y teléfono del responsable; en el
 * panel son opcionales para poder registrar una empresa con lo que se tenga.
 */
export function validarDatosEmpresa(
  input: Partial<EmpresaDatosInput>,
  { estricto }: { estricto: boolean }
): { datos: EmpresaDatos } | { errores: Errores<keyof EmpresaDatosInput> } {
  const errores: Errores<keyof EmpresaDatosInput> = {};
  const razon_social = limpiar(input.razon_social, 200);
  const nombre_comercial = limpiar(input.nombre_comercial, 120);
  const rfc = normalizarRfc(input.rfc);
  const giro = limpiar(input.giro, 120);
  const num = enteroOpcional(input.num_empleados);
  const regimen_fiscal = limpiar(input.regimen_fiscal, 120);
  const cp_fiscal = String(input.cp_fiscal ?? "").replace(/\D/g, "");
  const uso_cfdi = limpiar(input.uso_cfdi, 120);
  const correo_facturas = limpiar(input.correo_facturas, 200).toLowerCase();
  const domicilio_entrega = limpiar(input.domicilio_entrega, 400);
  const responsable_nombre = limpiar(input.responsable_nombre, 120);
  const responsable_puesto = limpiar(input.responsable_puesto, 120);
  const responsable_correo = limpiar(input.responsable_correo, 200).toLowerCase();
  const responsable_telefono = normalizarTelefono(input.responsable_telefono);

  if (razon_social.length < 2) errores.razon_social = "Escribe la razón social.";
  if (nombre_comercial.length < 2) errores.nombre_comercial = "Escribe el nombre comercial.";
  if (rfc ? !esRfcValido(rfc) : estricto) errores.rfc = "Escribe un RFC válido de 12 o 13 caracteres.";
  if (estricto && !giro) errores.giro = "Escribe el giro de la empresa.";
  if (Number.isNaN(num) || (num !== null && (!Number.isInteger(num) || num < 1))) {
    errores.num_empleados = "Escribe un número de empleados válido.";
  } else if (estricto && num === null) {
    errores.num_empleados = "Escribe el número aproximado de empleados.";
  }
  if (estricto && !regimen_fiscal) errores.regimen_fiscal = "Escribe el régimen fiscal.";
  if (cp_fiscal ? cp_fiscal.length !== 5 : estricto) errores.cp_fiscal = "El código postal debe tener 5 dígitos.";
  if (estricto && !uso_cfdi) errores.uso_cfdi = "Escribe el uso de CFDI.";
  if (correo_facturas ? !esCorreoValido(correo_facturas) : estricto) {
    errores.correo_facturas = "Escribe un correo válido para recibir facturas.";
  }
  if (responsable_nombre.length < 2) errores.responsable_nombre = "Escribe el nombre del responsable.";
  if (estricto && !responsable_puesto) errores.responsable_puesto = "Escribe el puesto del responsable.";
  if (!esCorreoValido(responsable_correo)) errores.responsable_correo = "Escribe un correo válido.";
  if (responsable_telefono ? responsable_telefono.length !== 10 : estricto) {
    errores.responsable_telefono = "El teléfono debe tener 10 dígitos.";
  }

  if (Object.keys(errores).length > 0) return { errores };
  return {
    datos: {
      razon_social,
      nombre_comercial,
      rfc: rfc || null,
      giro: giro || null,
      num_empleados: num,
      regimen_fiscal: regimen_fiscal || null,
      cp_fiscal: cp_fiscal || null,
      uso_cfdi: uso_cfdi || null,
      correo_facturas: correo_facturas || null,
      domicilio_entrega: domicilio_entrega || null,
      responsable_nombre,
      responsable_puesto: responsable_puesto || null,
      responsable_correo,
      responsable_telefono: responsable_telefono || null,
    },
  };
}

// --- Convenio (solo el panel) ---------------------------------------------

export interface ConvenioInput {
  limite_credito: string;
  dia_corte: string;
  plazo_pago_dias: string;
  plazo_autorizacion_dias: string;
  exige_numero_empleado: boolean;
  nomina_frecuencia: string;
  nomina_dia_semana: string;
  nomina_dia_mes: string;
  descuentos_por_compra: string;
  politica_porcentaje: string;
}

export interface Convenio {
  limite_credito: number | null;
  dia_corte: number | null;
  plazo_pago_dias: number | null;
  plazo_autorizacion_dias: number;
  exige_numero_empleado: boolean;
  nomina_frecuencia: FrecuenciaNomina | null;
  nomina_dia_semana: number | null;
  nomina_dia_mes: number | null;
  descuentos_por_compra: number;
  politica_porcentaje: number | null;
}

export function validarConvenio(
  input: Partial<ConvenioInput>
): { convenio: Convenio } | { errores: Errores<keyof ConvenioInput> } {
  const errores: Errores<keyof ConvenioInput> = {};
  const limite = enteroOpcional(input.limite_credito);
  const corte = enteroOpcional(input.dia_corte);
  const plazoPago = enteroOpcional(input.plazo_pago_dias);
  const plazoAut = enteroOpcional(input.plazo_autorizacion_dias) ?? 5;
  const frecuencia = String(input.nomina_frecuencia ?? "").trim();
  const diaSemana = enteroOpcional(input.nomina_dia_semana);
  const diaMes = enteroOpcional(input.nomina_dia_mes);
  const descuentos = enteroOpcional(input.descuentos_por_compra) ?? 1;
  const politica = enteroOpcional(input.politica_porcentaje);

  if (Number.isNaN(limite) || (limite !== null && limite < 0)) errores.limite_credito = "Escribe un monto válido.";
  if (Number.isNaN(corte) || (corte !== null && (!Number.isInteger(corte) || corte < 0 || corte > 28))) {
    errores.dia_corte = "Elige un día de corte del 1 al 28, o el último día del mes.";
  }
  if (Number.isNaN(plazoPago) || (plazoPago !== null && (!Number.isInteger(plazoPago) || plazoPago < 0 || plazoPago > 120))) {
    errores.plazo_pago_dias = "Escribe un plazo de 0 a 120 días.";
  }
  if (Number.isNaN(plazoAut) || !Number.isInteger(plazoAut) || plazoAut < 1 || plazoAut > 30) {
    errores.plazo_autorizacion_dias = "Escribe un plazo de 1 a 30 días hábiles.";
  }
  if (frecuencia && !["semanal", "quincenal", "mensual"].includes(frecuencia)) {
    errores.nomina_frecuencia = "Elige la frecuencia de nómina.";
  }
  if (frecuencia === "semanal" && (Number.isNaN(diaSemana) || diaSemana === null || diaSemana < 1 || diaSemana > 7)) {
    errores.nomina_dia_semana = "Elige el día de pago.";
  }
  if (frecuencia === "mensual" && (Number.isNaN(diaMes) || diaMes === null || diaMes < 0 || diaMes > 28)) {
    errores.nomina_dia_mes = "Elige el día de pago.";
  }
  if (Number.isNaN(descuentos) || !Number.isInteger(descuentos) || descuentos < 1 || descuentos > 24) {
    errores.descuentos_por_compra = "Escribe de 1 a 24 descuentos.";
  }
  if (Number.isNaN(politica) || (politica !== null && (politica <= 0 || politica > 100))) {
    errores.politica_porcentaje = "Escribe un porcentaje mayor a 0 y hasta 100.";
  }

  if (Object.keys(errores).length > 0) return { errores };
  return {
    convenio: {
      limite_credito: limite === null ? null : Math.round(limite * 100) / 100,
      dia_corte: corte,
      plazo_pago_dias: plazoPago,
      plazo_autorizacion_dias: plazoAut,
      exige_numero_empleado: Boolean(input.exige_numero_empleado),
      nomina_frecuencia: (frecuencia || null) as FrecuenciaNomina | null,
      nomina_dia_semana: frecuencia === "semanal" ? diaSemana : null,
      nomina_dia_mes: frecuencia === "mensual" ? diaMes : null,
      descuentos_por_compra: descuentos,
      politica_porcentaje: politica,
    },
  };
}

/** Valores que el panel propone para un convenio nuevo (el límite se decide caso por caso). */
export const CONVENIO_SUGERIDO: ConvenioInput = {
  limite_credito: "",
  dia_corte: "0",
  plazo_pago_dias: "15",
  plazo_autorizacion_dias: "5",
  exige_numero_empleado: false,
  nomina_frecuencia: "quincenal",
  nomina_dia_semana: "5",
  nomina_dia_mes: "0",
  descuentos_por_compra: "1",
  politica_porcentaje: "",
};

export function convenioCompleto(c: Pick<Convenio, "limite_credito" | "dia_corte" | "plazo_pago_dias">): boolean {
  return c.limite_credito !== null && c.dia_corte !== null && c.plazo_pago_dias !== null;
}
