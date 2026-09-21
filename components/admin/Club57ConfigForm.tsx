"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { updateClub57Config } from "@/app/(admin)/admin/(protected)/lealtad/configuracion/actions";

export interface Club57ConfigFormValues {
  montoPorPunto: string;
  tasaCanjePct: string;
  diasEsperaPendiente: string;
  puntosReferidor: string;
  puntosReferido: string;
}

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";
const hintClass = "mt-1 font-sans text-xs text-brand-slate/70";

export function Club57ConfigForm({ initialValues }: { initialValues: Club57ConfigFormValues }) {
  const montoPorPuntoId = useId();
  const tasaCanjePctId = useId();
  const diasEsperaPendienteId = useId();
  const puntosReferidorId = useId();
  const puntosReferidoId = useId();

  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Mismos rangos que el CHECK de la base (ver migración) — validar aquí
  // primero es solo para dar el mensaje al momento, sin esperar el
  // round-trip al servidor; el Server Action y la base vuelven a
  // validarlo de todas formas.
  function validate(): string | null {
    const montoPorPunto = Number.parseFloat(values.montoPorPunto);
    const tasaCanjePct = Number.parseFloat(values.tasaCanjePct);
    const diasEsperaPendiente = Number.parseInt(values.diasEsperaPendiente, 10);
    const puntosReferidor = Number.parseInt(values.puntosReferidor, 10);
    const puntosReferido = Number.parseInt(values.puntosReferido, 10);

    if (Number.isNaN(montoPorPunto) || montoPorPunto < 1) {
      return "El monto por punto debe ser de al menos $1.";
    }
    if (Number.isNaN(tasaCanjePct) || tasaCanjePct < 1 || tasaCanjePct > 50) {
      return "La tasa de canje debe estar entre 1% y 50%.";
    }
    if (Number.isNaN(diasEsperaPendiente) || diasEsperaPendiente < 0 || diasEsperaPendiente > 30) {
      return "Los días de espera deben estar entre 0 y 30.";
    }
    if (Number.isNaN(puntosReferidor) || puntosReferidor < 1 || puntosReferidor > 100) {
      return "Los puntos por referido (referidor) deben estar entre 1 y 100.";
    }
    if (Number.isNaN(puntosReferido) || puntosReferido < 1 || puntosReferido > 100) {
      return "Los puntos por referido (referido) deben estar entre 1 y 100.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("montoPorPunto", values.montoPorPunto);
    formData.set("tasaCanjePct", values.tasaCanjePct);
    formData.set("diasEsperaPendiente", values.diasEsperaPendiente);
    formData.set("puntosReferidor", values.puntosReferidor);
    formData.set("puntosReferido", values.puntosReferido);

    const result = await updateClub57Config(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-2xl sm:p-6"
    >
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          Cambios guardados.
        </p>
      )}

      <div>
        <label htmlFor={montoPorPuntoId} className={labelClass}>
          Monto por punto (MXN)
        </label>
        <input
          id={montoPorPuntoId}
          type="number"
          required
          min="1"
          step="0.01"
          value={values.montoPorPunto}
          onChange={(event) => setValues((current) => ({ ...current, montoPorPunto: event.target.value }))}
          className={inputClass}
        />
        <p className={hintClass}>Cada cuántos pesos gastados se otorga 1 punto. Mínimo $1.</p>
      </div>

      <div>
        <label htmlFor={tasaCanjePctId} className={labelClass}>
          Tasa de canje (%)
        </label>
        <input
          id={tasaCanjePctId}
          type="number"
          required
          min="1"
          max="50"
          step="0.01"
          value={values.tasaCanjePct}
          onChange={(event) => setValues((current) => ({ ...current, tasaCanjePct: event.target.value }))}
          className={inputClass}
        />
        <p className={hintClass}>Rango permitido: 1% a 50%.</p>
      </div>

      <div>
        <label htmlFor={diasEsperaPendienteId} className={labelClass}>
          Días de espera antes de disponible
        </label>
        <input
          id={diasEsperaPendienteId}
          type="number"
          required
          min="0"
          max="30"
          step="1"
          value={values.diasEsperaPendiente}
          onChange={(event) =>
            setValues((current) => ({ ...current, diasEsperaPendiente: event.target.value }))
          }
          className={inputClass}
        />
        <p className={hintClass}>
          Días que un movimiento de puntos permanece &quot;pendiente&quot; antes de estar disponible para
          canje. Rango permitido: 0 a 30.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={puntosReferidorId} className={labelClass}>
            Puntos por referido (quien refiere)
          </label>
          <input
            id={puntosReferidorId}
            type="number"
            required
            min="1"
            max="100"
            step="1"
            value={values.puntosReferidor}
            onChange={(event) =>
              setValues((current) => ({ ...current, puntosReferidor: event.target.value }))
            }
            className={inputClass}
          />
          <p className={hintClass}>Rango permitido: 1 a 100.</p>
        </div>
        <div>
          <label htmlFor={puntosReferidoId} className={labelClass}>
            Puntos por referido (quien es referido)
          </label>
          <input
            id={puntosReferidoId}
            type="number"
            required
            min="1"
            max="100"
            step="1"
            value={values.puntosReferido}
            onChange={(event) =>
              setValues((current) => ({ ...current, puntosReferido: event.target.value }))
            }
            className={inputClass}
          />
          <p className={hintClass}>Rango permitido: 1 a 100.</p>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
