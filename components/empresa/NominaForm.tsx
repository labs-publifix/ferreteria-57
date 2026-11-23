"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import { configurarNomina } from "@/app/(site)/empresa/actions";
import { DIAS_SEMANA } from "@/lib/club57/empresas/datos";

const FRECUENCIAS = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal (días 15 y último)" },
  { value: "mensual", label: "Mensual" },
];
const DIAS_SEMANA_OPC = DIAS_SEMANA.map((dia, i) => ({ value: String(i + 1), label: dia }));
const DIAS_MES_OPC = [
  { value: "0", label: "Último día del mes" },
  ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Día ${i + 1}` })),
];

const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

// Cómo y cuándo descuenta la empresa a sus empleados (informativo: con
// esto se calcula cuándo vuelve a estar disponible el crédito de cada uno).
export function NominaForm({
  initial,
}: {
  initial: { frecuencia: string; diaSemana: string; diaMes: string; descuentos: string; politica: string };
}) {
  const router = useRouter();
  const baseId = useId();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setOk(false);
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setError(null);
    const result = await configurarNomina(values);
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="font-display text-base uppercase text-brand-slate">Nómina y crédito</h2>
        <p className="mt-1 max-w-prose font-sans text-sm text-brand-slate/80">
          Así sabremos cuándo vuelve a estar disponible el crédito de cada empleado conforme le descuentas en nómina.
          Puedes asignar una frecuencia distinta a un empleado desde su ficha.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className={labelClass}>Frecuencia de nómina</span>
          <Select value={values.frecuencia} onChange={(v) => set("frecuencia", v)} options={FRECUENCIAS} label="Frecuencia de nómina" placeholder="Elige" />
        </div>
        {values.frecuencia === "semanal" && (
          <div>
            <span className={labelClass}>Día de pago</span>
            <Select value={values.diaSemana} onChange={(v) => set("diaSemana", v)} options={DIAS_SEMANA_OPC} label="Día de pago" />
          </div>
        )}
        {values.frecuencia === "mensual" && (
          <div>
            <span className={labelClass}>Día de pago</span>
            <Select value={values.diaMes} onChange={(v) => set("diaMes", v)} options={DIAS_MES_OPC} label="Día de pago" />
          </div>
        )}
        <div>
          <label htmlFor={`${baseId}-descuentos`} className={labelClass}>
            Descuentos por compra
          </label>
          <input
            id={`${baseId}-descuentos`}
            inputMode="numeric"
            value={values.descuentos}
            onChange={(event) => set("descuentos", event.target.value)}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">En cuántas nóminas se reparte cada compra.</p>
        </div>
        <div>
          <label htmlFor={`${baseId}-politica`} className={labelClass}>
            Línea general (% del salario)
          </label>
          <input
            id={`${baseId}-politica`}
            inputMode="decimal"
            value={values.politica}
            onChange={(event) => set("politica", event.target.value)}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">Opcional. Se propone al aprobar a cada empleado.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={guardando || !values.frecuencia}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        {ok && (
          <span role="status" className="font-sans text-sm text-green-800">
            Cambios guardados.
          </span>
        )}
      </div>
    </form>
  );
}
