"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import { confirmarNomina } from "@/app/(site)/empresa/actions";
import {
  fechaNominaLabel,
  validarExcepciones,
  type ExcepcionNomina,
  type Nomina,
  type NominasAgrupadas,
} from "@/lib/club57/empresas/nomina";
import { ultimoDiaPlazo } from "@/lib/club57/empresas/pedidos";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2 font-sans text-base text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";

type Resultado = "completo" | "distinto" | "no";

// Portal Empresa · Nómina: los descuentos de cada fecha de pago. La empresa
// confirma lo que descontó (con excepciones) y así se libera el crédito de
// sus colaboradores; si no confirma en 3 días hábiles, se toma como aplicada.
export function NominaManager({ nominas }: { nominas: NominasAgrupadas }) {
  const vacio = nominas.porConfirmar.length + nominas.proximas.length + nominas.historial.length === 0;
  if (vacio) {
    return (
      <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
        Aún no hay descuentos de nómina. Cuando autorices un pedido, aquí verás en qué nóminas se descuenta.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {nominas.porConfirmar.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="nomina-confirmar">
          <h2 id="nomina-confirmar" className="font-display text-base uppercase text-brand-slate">
            Por confirmar
          </h2>
          {nominas.porConfirmar.map((n) => (
            <NominaPorConfirmar key={n.fecha} nomina={n} />
          ))}
        </section>
      )}

      {nominas.proximas.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="nomina-proximas">
          <div>
            <h2 id="nomina-proximas" className="font-display text-base uppercase text-brand-slate">
              Próximas nóminas
            </h2>
            <p className="mt-1 font-sans text-sm text-brand-slate/80">
              Descarga el Excel para cargar los descuentos a tu sistema de nómina antes de la fecha de pago.
            </p>
          </div>
          {nominas.proximas.map((n) => (
            <NominaResumen key={n.fecha} nomina={n} />
          ))}
        </section>
      )}

      {nominas.historial.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="nomina-historial">
          <h2 id="nomina-historial" className="font-display text-base uppercase text-brand-slate">
            Historial
          </h2>
          {nominas.historial.map((n) => (
            <NominaResumen key={n.fecha} nomina={n} />
          ))}
        </section>
      )}
    </div>
  );
}

function ExcelLink({ fecha }: { fecha: string }) {
  return (
    <a href={`/api/empresa/nomina?fecha=${fecha}`} className={buttonClassName("secondary", "shrink-0")}>
      <Download className="size-4" aria-hidden="true" strokeWidth={2} />
      Excel
    </a>
  );
}

function NominaPorConfirmar({ nomina }: { nomina: Nomina }) {
  const router = useRouter();
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excepciones: ExcepcionNomina[] = nomina.empleados
    .filter((e) => (resultados[e.empleadoId] ?? "completo") !== "completo")
    .map((e) => ({
      empleado_id: e.empleadoId,
      monto_aplicado: resultados[e.empleadoId] === "no" ? 0 : Number((montos[e.empleadoId] ?? "").replace(/[$,\s]/g, "")),
    }));
  const totalAplicado = nomina.empleados.reduce((sum, e) => {
    const exc = excepciones.find((x) => x.empleado_id === e.empleadoId);
    return sum + (exc ? (Number.isFinite(exc.monto_aplicado) ? exc.monto_aplicado : 0) : e.total);
  }, 0);

  async function confirmar() {
    const invalido = excepciones.some((e) => !Number.isFinite(e.monto_aplicado));
    const mensaje = invalido ? "Escribe el monto que sí se descontó." : validarExcepciones(nomina, excepciones);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setGuardando(true);
    setError(null);
    const result = await confirmarNomina(nomina.fecha, excepciones);
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <article className="rounded-lg border-l-4 border-brand-orange bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-base font-semibold text-brand-black">Nómina del {fechaNominaLabel(nomina.fecha)}</h3>
          <p className="mt-0.5 font-sans text-sm text-brand-slate">
            {nomina.empleados.length} {nomina.empleados.length === 1 ? "colaborador" : "colaboradores"} ·{" "}
            <strong className="text-brand-black">{pesos.format(nomina.total)}</strong> a descontar
          </p>
          <p className="mt-1 font-sans text-xs font-semibold text-orange-800">
            Si no la confirmas a más tardar el {ultimoDiaPlazo(nomina.tacitaAt)}, se toma como aplicada completa.
          </p>
        </div>
        <ExcelLink fecha={nomina.fecha} />
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-brand-slate/10 border-y border-brand-slate/10">
        {nomina.empleados.map((e) => {
          const r = resultados[e.empleadoId] ?? "completo";
          return (
            <li key={e.empleadoId} className="flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-brand-black">
                  {e.nombre}
                  {e.numero && <span className="ml-2 font-normal text-brand-slate">núm. {e.numero}</span>}
                </p>
                <p className="font-sans text-xs text-brand-slate">
                  {pesos.format(e.total)} · {e.pedidos.join(", ")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div role="radiogroup" aria-label={`Resultado del descuento de ${e.nombre}`} className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["completo", "Se aplicó"],
                      ["distinto", "Monto distinto"],
                      ["no", "No se aplicó"],
                    ] as [Resultado, string][]
                  ).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      role="radio"
                      aria-checked={r === valor}
                      onClick={() => {
                        setError(null);
                        setResultados((actual) => ({ ...actual, [e.empleadoId]: valor }));
                      }}
                      className={`min-h-11 rounded-full border px-3 font-sans text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
                        r === valor
                          ? "border-brand-slate bg-brand-slate text-white"
                          : "border-brand-slate/30 bg-white text-brand-black hover:border-brand-slate"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>
                {r === "distinto" && (
                  <label className="flex items-center gap-2 font-sans text-sm text-brand-slate sm:w-44">
                    <span className="sr-only">Monto descontado a {e.nombre}</span>
                    <input
                      inputMode="decimal"
                      placeholder="Monto descontado"
                      value={montos[e.empleadoId] ?? ""}
                      onChange={(ev) => {
                        setError(null);
                        setMontos((actual) => ({ ...actual, [e.empleadoId]: ev.target.value }));
                      }}
                      className={inputClass}
                    />
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {excepciones.length > 0 && (
        <p className="mt-3 font-sans text-xs text-brand-slate">
          Lo que no se descontó pasa a la siguiente nómina de cada colaborador.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-sm text-brand-slate">
          Total descontado: <strong className="text-brand-black">{pesos.format(totalAplicado)}</strong>
        </p>
        <Button type="button" onClick={confirmar} disabled={guardando} className="w-full sm:w-auto">
          {guardando ? "Confirmando…" : "Confirmar nómina"}
        </Button>
      </div>
    </article>
  );
}

function NominaResumen({ nomina }: { nomina: Nomina }) {
  const confirmada = nomina.estado !== "pendiente";
  const diferencia = confirmada && nomina.aplicado < nomina.total - 0.005;
  return (
    <article className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-semibold text-brand-black">Nómina del {fechaNominaLabel(nomina.fecha)}</h3>
          <p className="mt-0.5 font-sans text-sm text-brand-slate">
            {nomina.empleados.length} {nomina.empleados.length === 1 ? "colaborador" : "colaboradores"} ·{" "}
            {confirmada ? (
              <>
                <strong className="text-brand-black">{pesos.format(nomina.aplicado)}</strong> descontado
                {diferencia && ` de ${pesos.format(nomina.total)}`}
              </>
            ) : (
              <>
                <strong className="text-brand-black">{pesos.format(nomina.total)}</strong> a descontar
              </>
            )}
          </p>
          {confirmada && (
            <p className="mt-1 font-sans text-xs">
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  nomina.estado === "tacita" ? "bg-brand-gray text-brand-slate" : "bg-green-100 text-green-800"
                }`}
              >
                {nomina.estado === "tacita" ? "Aplicada en automático" : "Confirmada"}
              </span>
            </p>
          )}
        </div>
        <ExcelLink fecha={nomina.fecha} />
      </div>
      <details className="group mt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-sans text-sm font-semibold text-brand-slate hover:text-brand-black [&::-webkit-details-marker]:hidden">
          Ver colaboradores
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-1 flex flex-col gap-1 rounded-md bg-brand-gray/60 p-3 font-sans text-sm">
          {nomina.empleados.map((e) => (
            <li key={e.empleadoId} className="flex justify-between gap-3 text-brand-black">
              <span className="min-w-0">
                {e.nombre}
                {e.numero && <span className="text-brand-slate"> · núm. {e.numero}</span>}
                {e.baja && <span className="text-brand-slate"> · baja</span>}
              </span>
              <span className="shrink-0 tabular-nums">
                {confirmada && e.aplicado < e.total - 0.005 ? (
                  <>
                    {pesos.format(e.aplicado)} <span className="text-brand-slate">de {pesos.format(e.total)}</span>
                  </>
                ) : (
                  pesos.format(confirmada ? e.aplicado : e.total)
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
