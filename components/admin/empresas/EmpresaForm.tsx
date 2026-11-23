"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import {
  actualizarEmpresa,
  crearEmpresa,
  type EmpresaFormInput,
  type EmpresaFormResult,
} from "@/app/(admin)/admin/(protected)/lealtad/empresas/actions";
import { CONVENIO_SUGERIDO, DIAS_SEMANA, type ConvenioInput, type EmpresaDatosInput } from "@/lib/club57/empresas/datos";

export interface EmpresaFormValues {
  datos: EmpresaDatosInput;
  convenio: ConvenioInput;
  notas_internas: string;
}

export const EMPRESA_VACIA: EmpresaFormValues = {
  datos: {
    razon_social: "",
    nombre_comercial: "",
    rfc: "",
    giro: "",
    num_empleados: "",
    regimen_fiscal: "",
    cp_fiscal: "",
    uso_cfdi: "",
    correo_facturas: "",
    domicilio_entrega: "",
    responsable_nombre: "",
    responsable_puesto: "",
    responsable_correo: "",
    responsable_telefono: "",
  },
  convenio: CONVENIO_SUGERIDO,
  notas_internas: "",
};

const inputClass =
  "min-h-11 w-full rounded-md border bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";
const DIAS_MES = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Día ${i + 1}` }));
const OPCIONES_CORTE = [{ value: "", label: "Sin definir" }, { value: "0", label: "Último día del mes" }, ...DIAS_MES];
const OPCIONES_FRECUENCIA = [
  { value: "", label: "Sin definir" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal (días 15 y último)" },
  { value: "mensual", label: "Mensual" },
];
const OPCIONES_DIA_SEMANA = DIAS_SEMANA.map((dia, i) => ({ value: String(i + 1), label: dia }));
const OPCIONES_DIA_MES = [{ value: "0", label: "Último día del mes" }, ...DIAS_MES];

const sectionClass = "flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6";
const h2Class = "font-display text-base uppercase text-brand-slate";

type CampoDatos = keyof EmpresaDatosInput;
type CampoConvenio = Exclude<keyof ConvenioInput, "exige_numero_empleado">;

const DATOS: { titulo: string; campos: { name: CampoDatos; label: string; wide?: boolean; type?: string; inputMode?: "numeric" | "email" | "tel" }[] }[] = [
  {
    titulo: "Empresa",
    campos: [
      { name: "nombre_comercial", label: "Nombre comercial" },
      { name: "razon_social", label: "Razón social" },
      { name: "rfc", label: "RFC" },
      { name: "giro", label: "Giro" },
      { name: "num_empleados", label: "Número de empleados (aprox.)", inputMode: "numeric" },
    ],
  },
  {
    titulo: "Datos fiscales",
    campos: [
      { name: "regimen_fiscal", label: "Régimen fiscal" },
      { name: "uso_cfdi", label: "Uso de CFDI" },
      { name: "cp_fiscal", label: "Código postal fiscal", inputMode: "numeric" },
      { name: "correo_facturas", label: "Correo para facturas", type: "email", inputMode: "email" },
    ],
  },
  {
    titulo: "Responsable",
    campos: [
      { name: "responsable_nombre", label: "Nombre" },
      { name: "responsable_puesto", label: "Puesto" },
      { name: "responsable_correo", label: "Correo", type: "email", inputMode: "email" },
      { name: "responsable_telefono", label: "Teléfono (10 dígitos)", type: "tel", inputMode: "tel" },
      { name: "domicilio_entrega", label: "Domicilio de entrega de la empresa", wide: true },
    ],
  },
];

export function EmpresaForm({
  mode,
  empresaId,
  initialValues = EMPRESA_VACIA,
}: {
  mode: "create" | "edit";
  empresaId?: string;
  initialValues?: EmpresaFormValues;
}) {
  const router = useRouter();
  const baseId = useId();
  const [values, setValues] = useState<EmpresaFormValues>(initialValues);
  const [activar, setActivar] = useState(true);
  const [result, setResult] = useState<EmpresaFormResult | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const guardandoRef = useRef(false);
  const errores = (result?.errores ?? {}) as Record<string, string | undefined>;

  function setDato(name: CampoDatos, value: string) {
    setGuardado(false);
    setValues((v) => ({ ...v, datos: { ...v.datos, [name]: value } }));
  }
  function setConvenio<K extends keyof ConvenioInput>(name: K, value: ConvenioInput[K]) {
    setGuardado(false);
    setValues((v) => ({ ...v, convenio: { ...v.convenio, [name]: value } }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    const payload: EmpresaFormInput = values;
    const response = mode === "create" ? await crearEmpresa(payload, activar) : await actualizarEmpresa(empresaId!, payload);
    guardandoRef.current = false;
    setGuardando(false);
    setResult(response);
    if (response.id && mode === "create") {
      router.push(`/admin/lealtad/empresas/${response.id}${response.aviso ? "?aviso=convenio" : ""}`);
      return;
    }
    if (response.id) {
      setGuardado(true);
      router.refresh();
    }
  }

  function campoTexto(id: string, name: string, value: string, onChange: (v: string) => void, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) {
    const error = errores[name];
    return (
      <>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} ${error ? "border-red-600" : "border-brand-slate/30"}`}
          {...extra}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 font-sans text-xs text-red-700">
            {error}
          </p>
        )}
      </>
    );
  }

  const c = values.convenio;
  const convenioCampo = (name: CampoConvenio, label: string, hint?: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => {
    const id = `${baseId}-${name}`;
    return (
      <div>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {campoTexto(id, name, c[name], (v) => setConvenio(name, v), extra)}
        {hint && <p className="mt-1 font-sans text-xs text-brand-slate/70">{hint}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 pb-10">
      {result?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {result.error}
        </p>
      )}

      {DATOS.map((grupo) => (
        <section key={grupo.titulo} className={sectionClass}>
          <h2 className={h2Class}>{grupo.titulo}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {grupo.campos.map((campo) => {
              const id = `${baseId}-${campo.name}`;
              return (
                <div key={campo.name} className={campo.wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className={labelClass}>
                    {campo.label}
                  </label>
                  {campoTexto(id, campo.name, values.datos[campo.name], (v) => setDato(campo.name, v), {
                    type: campo.type ?? "text",
                    inputMode: campo.inputMode,
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className={sectionClass}>
        <div>
          <h2 className={h2Class}>Convenio</h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/70">
            Límite de crédito, día de corte y plazo de pago son necesarios para activar la empresa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {convenioCampo("limite_credito", "Límite de crédito (MXN)", "Máximo que la empresa puede deber, sumando sus ciclos.", { inputMode: "decimal" })}
          <div>
            <span className={labelClass}>Día de corte</span>
            <Select
              value={c.dia_corte}
              onChange={(value) => setConvenio("dia_corte", value)}
              options={OPCIONES_CORTE}
              label="Día de corte"
            />
            {errores.dia_corte && <p className="mt-1 font-sans text-xs text-red-700">{errores.dia_corte}</p>}
          </div>
          {convenioCampo("plazo_pago_dias", "Plazo de pago (días)", "Días para pagar después de recibir la factura.", { inputMode: "numeric" })}
          {convenioCampo("plazo_autorizacion_dias", "Plazo para autorizar pedidos", "Días hábiles. Si vence, el pedido se cancela.", { inputMode: "numeric" })}
        </div>
        <label className="flex min-h-11 items-center gap-2 font-sans text-sm text-brand-black">
          <input
            type="checkbox"
            checked={c.exige_numero_empleado}
            onChange={(event) => setConvenio("exige_numero_empleado", event.target.checked)}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          Exigir número de empleado al registrarse
        </label>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className={h2Class}>Nómina y crédito de los empleados</h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/70">
            Informativo: con esto se calcula cuándo vuelve a estar disponible el crédito de cada empleado. La empresa
            también podrá ajustarlo desde su portal.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className={labelClass}>Frecuencia de nómina</span>
            <Select
              value={c.nomina_frecuencia}
              onChange={(value) => setConvenio("nomina_frecuencia", value)}
              options={OPCIONES_FRECUENCIA}
              label="Frecuencia de nómina"
            />
          </div>
          {c.nomina_frecuencia === "semanal" && (
            <div>
              <span className={labelClass}>Día de pago</span>
              <Select
                value={c.nomina_dia_semana}
                onChange={(value) => setConvenio("nomina_dia_semana", value)}
                options={OPCIONES_DIA_SEMANA}
                label="Día de pago"
              />
            </div>
          )}
          {c.nomina_frecuencia === "mensual" && (
            <div>
              <span className={labelClass}>Día de pago</span>
              <Select
                value={c.nomina_dia_mes}
                onChange={(value) => setConvenio("nomina_dia_mes", value)}
                options={OPCIONES_DIA_MES}
                label="Día de pago"
              />
            </div>
          )}
          {convenioCampo("descuentos_por_compra", "Descuentos por compra", "En cuántas nóminas se reparte cada compra.", { inputMode: "numeric" })}
          {convenioCampo("politica_porcentaje", "Línea general (% del salario)", "Opcional. La empresa puede ajustar a cada empleado.", { inputMode: "decimal" })}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={h2Class}>Notas internas</h2>
        <label htmlFor={`${baseId}-notas`} className="sr-only">
          Notas internas
        </label>
        <textarea
          id={`${baseId}-notas`}
          rows={3}
          value={values.notas_internas}
          onChange={(event) => {
            setGuardado(false);
            setValues((v) => ({ ...v, notas_internas: event.target.value }));
          }}
          className={`${inputClass} border-brand-slate/30`}
        />
        <p className="-mt-2 font-sans text-xs text-brand-slate/70">Solo las ve el personal de Ferretería 57.</p>
      </section>

      {mode === "create" && (
        <label className="flex min-h-11 items-center gap-2 rounded-lg bg-white p-4 font-sans text-sm text-brand-black shadow-sm">
          <input
            type="checkbox"
            checked={activar}
            onChange={(event) => setActivar(event.target.checked)}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          Activar de inmediato y generar el código de la empresa
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : mode === "create" ? "Guardar empresa" : "Guardar cambios"}
        </Button>
        {guardado && (
          <span role="status" className="font-sans text-sm text-green-800">
            Cambios guardados.
          </span>
        )}
      </div>
    </form>
  );
}
