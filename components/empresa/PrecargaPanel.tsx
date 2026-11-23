"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import { confirmarPrecarga, leerPrecarga } from "@/app/(site)/empresa/actions";
import type { PrecargaError, PrecargaFila } from "@/lib/club57/empresas/empleados";

const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// Precarga de empleados por Excel: quien se registre con el código y
// coincida por correo o número queda aprobado con estos datos.
export function PrecargaPanel({ pendientesPrevias }: { pendientesPrevias: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validas, setValidas] = useState<PrecargaFila[] | null>(null);
  const [errores, setErrores] = useState<PrecargaError[]>([]);
  const [resultado, setResultado] = useState<{ cargadas: number; aprobadas: number } | null>(null);

  async function leer() {
    if (!file) return;
    setLeyendo(true);
    setError(null);
    setResultado(null);
    const fd = new FormData();
    fd.set("file", file);
    const r = await leerPrecarga(fd);
    setLeyendo(false);
    if (r.error) {
      setError(r.error);
      setValidas(null);
      return;
    }
    setValidas(r.validas ?? []);
    setErrores(r.errores ?? []);
  }

  async function confirmar() {
    if (!validas) return;
    setGuardando(true);
    setError(null);
    const r = await confirmarPrecarga(validas);
    setGuardando(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setResultado({ cargadas: r.cargadas ?? 0, aprobadas: r.aprobadas ?? 0 });
    setValidas(null);
    setFile(null);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose">
          <h2 className="font-display text-base uppercase text-brand-slate">Precarga de empleados</h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">
            Sube la lista de quienes participarán, con su línea. Quien se registre con tu código y coincida por correo o
            número de empleado quedará aprobado sin que tengas que revisarlo.
            {pendientesPrevias > 0 && " Las solicitudes en revisión que coincidan se aprueban al cargar."}
          </p>
        </div>
        <a href="/api/empresa/plantilla-empleados" className={buttonClassName("secondary", "shrink-0")}>
          <Download className="size-4" aria-hidden="true" strokeWidth={2} />
          Descargar plantilla
        </a>
      </div>

      {resultado && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          Lista cargada: {resultado.cargadas} {resultado.cargadas === 1 ? "empleado" : "empleados"}.
          {resultado.aprobadas > 0 && ` ${resultado.aprobadas} solicitudes en revisión quedaron aprobadas.`}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      {validas === null ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-slate/30 px-4 py-4 font-sans text-sm text-brand-slate hover:border-brand-slate/50">
            <Upload className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {file ? file.name : "Elegir archivo .xlsx o .csv"}
            <input
              type="file"
              accept=".xlsx,.csv"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </label>
          <Button type="button" onClick={leer} disabled={!file || leyendo}>
            {leyendo ? "Revisando…" : "Revisar archivo"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-sans text-sm text-brand-black">
            <strong className="text-green-800">{validas.length}</strong> listos para cargar
            {errores.length > 0 && (
              <>
                {" · "}
                <strong className="text-red-700">{errores.length}</strong> con error (no se cargan)
              </>
            )}
          </p>
          {validas.length > 0 && (
            <div className="min-w-0 overflow-x-auto rounded-md border border-brand-slate/15">
              <table className="w-full min-w-[560px] text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Empleado</th>
                    <th className="px-3 py-2 text-right">Salario</th>
                    <th className="px-3 py-2 text-right">Línea</th>
                  </tr>
                </thead>
                <tbody>
                  {validas.slice(0, 50).map((f) => (
                    <tr key={f.fila} className="border-b border-brand-slate/10 last:border-0">
                      <td className="px-3 py-2 text-brand-slate/70">{f.fila}</td>
                      <td className="px-3 py-2 text-brand-black">
                        {f.nombre ?? "—"}
                        <span className="block text-xs text-brand-slate">{[f.correo, f.numero_empleado].filter(Boolean).join(" · ")}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-brand-slate">
                        {f.salario_mensual === null ? "—" : pesos.format(f.salario_mensual)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-brand-black">
                        {pesos.format(f.linea_credito)}
                        <span className="block text-xs text-brand-slate">{f.linea_tipo === "porcentaje" ? `${f.linea_valor} %` : "monto fijo"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validas.length > 50 && (
                <p className="px-3 py-2 font-sans text-xs text-brand-slate/70">Y {validas.length - 50} más.</p>
              )}
            </div>
          )}
          {errores.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-md bg-red-50 p-3 font-sans text-xs text-red-700">
              {errores.slice(0, 30).map((e) => (
                <li key={`${e.fila}-${e.motivo}`}>
                  Fila {e.fila}: {e.motivo}
                </li>
              ))}
            </ul>
          )}
          <p className="font-sans text-xs text-brand-slate/70">
            Al cargar se reemplaza la lista anterior de empleados que todavía no se han registrado.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={confirmar} disabled={guardando || validas.length === 0}>
              {guardando ? "Cargando…" : `Cargar ${validas.length} empleados`}
            </Button>
            <button type="button" onClick={() => setValidas(null)} className={buttonClassName("secondary")}>
              Elegir otro archivo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
