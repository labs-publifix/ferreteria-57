"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Modal } from "@/components/ui";
import { correctClub57Purchase } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";
import { CLUB57_TIPO_LABEL } from "@/lib/club57/labels";
import {
  CLUB57_MOTIVOS,
  CLUB57_PLAZO_CORRECCION_DIAS,
  club57AnotarCorrecciones,
  club57MotivoTexto,
  type Club57Motivo,
} from "@/lib/club57/correcciones";

export interface Club57StaffLedgerRow {
  id: string;
  cantidad: number;
  tipo: string;
  estado: "pendiente" | "disponible";
  fecha_disponible: string | null;
  referencia: string | null;
  producto_nombre: string | null;
  producto_sku: string | null;
  monto: number | null;
  anula_a: string | null;
  corrige_a: string | null;
  motivo: string | null;
  motivo_nota: string | null;
  created_at: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const pesosFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

// Historial de puntos de un cliente para el personal (admin y vendedor):
// misma tabla en /admin/lealtad/clientes/[id] y /admin/vendedor/clientes/[id],
// con la acción de cancelar o corregir cada compra en tienda. Qué se
// permite lo decide club57_corregir_compra() en la base; aquí solo se
// oculta el botón cuando ya se sabe que no aplica (vendedor fuera de plazo).
export function Club57StaffLedgerHistory({
  rows,
  role,
  hoy,
  montoPorPunto,
}: {
  rows: Club57StaffLedgerRow[];
  role: "admin" | "vendedor";
  hoy: string;
  montoPorPunto: number;
}) {
  const info = useMemo(() => club57AnotarCorrecciones(rows, hoy), [rows, hoy]);
  const [target, setTarget] = useState<Club57StaffLedgerRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="font-sans text-sm text-brand-slate/70">Sin movimientos todavía.</p>;
  }

  return (
    <>
      {notice && (
        <p role="status" className="mb-3 rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {notice}
        </p>
      )}
      {/* relative: el <span className="sr-only"> de la última columna es
          absolute; sin un ancestro posicionado dentro del contenedor con
          scroll, se ubica contra la página y la ensancha en celular. */}
      <div className="relative min-w-0 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
              <th className="py-2 pr-3">Fecha</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3">Puntos</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Referencia</th>
              <th className="py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowInfo = info.get(row.id)!;
              const anulada = rowInfo.estadoCompra !== null;
              const motivoTexto = club57MotivoTexto(row.motivo, row.motivo_nota);
              return (
                <tr key={row.id} className="border-b border-brand-slate/10 align-top last:border-0">
                  <td className="py-2 pr-3 text-brand-slate">{dateTimeFormatter.format(new Date(row.created_at))}</td>
                  <td className="py-2 pr-3 text-brand-black">
                    {row.tipo === "cancelacion_compra" &&
                    rowInfo.compraAnulada &&
                    info.get(rowInfo.compraAnulada.id)?.estadoCompra === "corregida"
                      ? "Ajuste por corrección"
                      : CLUB57_TIPO_LABEL[row.tipo] ?? row.tipo}
                    {rowInfo.estadoCompra && (
                      <span className="mt-1 block">
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                          {rowInfo.estadoCompra === "cancelada" ? "Cancelada" : "Corregida"}
                        </span>
                      </span>
                    )}
                    {rowInfo.original && (
                      <span className="block text-xs text-brand-slate/70">
                        Corrige la compra del {dateFormatter.format(new Date(rowInfo.original.created_at))}
                      </span>
                    )}
                    {row.tipo === "cancelacion_compra" && motivoTexto && (
                      <span className="block text-xs text-brand-slate/70">Motivo: {motivoTexto}</span>
                    )}
                  </td>
                  <td className="max-w-[200px] py-2 pr-3 text-brand-black">
                    {row.producto_nombre ? (
                      <>
                        {row.producto_nombre}
                        {row.producto_sku && (
                          <span className="block text-xs text-brand-slate/60">Cód. {row.producto_sku}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`py-2 pr-3 font-medium ${row.cantidad < 0 ? "text-red-700" : "text-brand-black"} ${
                      anulada ? "line-through decoration-brand-slate/50" : ""
                    }`}
                  >
                    {row.cantidad > 0 ? "+" : ""}
                    {row.cantidad}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.estado === "disponible" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.estado === "disponible" ? "Disponible" : "Pendiente"}
                    </span>
                  </td>
                  <td className="max-w-[220px] py-2 pr-3 text-brand-slate">{row.referencia ?? "—"}</td>
                  <td className="py-2 text-right">
                    {rowInfo.corregible &&
                      (rowInfo.dentroDePlazo || role === "admin" ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNotice(null);
                              setTarget(row);
                            }}
                            className={buttonClassName("secondary", "whitespace-nowrap !px-3 !py-1.5 text-xs")}
                          >
                            Corregir o cancelar
                          </button>
                          {!rowInfo.dentroDePlazo && (
                            <span className="whitespace-nowrap text-xs text-amber-800">Fuera de plazo</span>
                          )}
                        </div>
                      ) : (
                        <span className="block max-w-[150px] text-xs text-brand-slate/70">
                          Plazo de {CLUB57_PLAZO_CORRECCION_DIAS} días vencido. Pide a un administrador que la revise.
                        </span>
                      ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {target && (
        <CorrectPurchaseDialog
          compra={target}
          role={role}
          diasDesdeCompra={info.get(target.id)!.diasDesdeCompra}
          fechaCompraRaiz={info.get(target.id)!.fechaCompraRaiz}
          montoPorPunto={montoPorPunto}
          onClose={() => setTarget(null)}
          onDone={(message) => {
            setTarget(null);
            setNotice(message);
          }}
        />
      )}
    </>
  );
}

function CorrectPurchaseDialog({
  compra,
  role,
  diasDesdeCompra,
  fechaCompraRaiz,
  montoPorPunto,
  onClose,
  onDone,
}: {
  compra: Club57StaffLedgerRow;
  role: "admin" | "vendedor";
  diasDesdeCompra: number;
  fechaCompraRaiz: string;
  montoPorPunto: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const productoId = useId();
  const codigoId = useId();
  const montoId = useId();
  const notaId = useId();
  const justificacionId = useId();
  const confirmId = useId();

  const [accion, setAccion] = useState<"cancelar" | "corregir">("cancelar");
  const [motivo, setMotivo] = useState<Club57Motivo | "">("");
  const [nota, setNota] = useState("");
  const [producto, setProducto] = useState(compra.producto_nombre ?? "");
  const [codigo, setCodigo] = useState(compra.producto_sku ?? "");
  const [monto, setMonto] = useState(compra.monto !== null ? String(compra.monto) : "");
  // El servidor puede decir que está fuera de plazo aunque aquí se haya
  // calculado lo contrario (p. ej. justo a la medianoche).
  const [forzarExcepcion, setForzarExcepcion] = useState(false);
  const [confirmaExcepcion, setConfirmaExcepcion] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const fueraDePlazo = diasDesdeCompra > CLUB57_PLAZO_CORRECCION_DIAS || forzarExcepcion;
  const montoNumber = Number.parseFloat(monto);
  const puntosNuevos =
    accion === "corregir" && !Number.isNaN(montoNumber) && montoNumber > 0
      ? Math.floor(montoNumber / montoPorPunto)
      : null;
  const descuentaDisponibles = compra.estado === "disponible";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    if (!motivo) {
      setError("Elige el motivo.");
      return;
    }
    if (motivo === "otro" && !nota.trim()) {
      setError("Escribe el motivo en la nota.");
      return;
    }
    if (fueraDePlazo && role === "admin") {
      if (!confirmaExcepcion) {
        setError("Confirma que es una excepción a la política de 7 días.");
        return;
      }
      if (justificacion.trim().length < 10) {
        setError("Escribe la justificación de la excepción (mínimo 10 caracteres).");
        return;
      }
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    const result = await correctClub57Purchase({
      compraId: compra.id,
      accion,
      motivo,
      motivoNota: nota,
      monto,
      productoNombre: producto,
      productoSku: codigo,
      fueraDePolitica: fueraDePlazo && role === "admin" && confirmaExcepcion,
      justificacion,
    });
    submittingRef.current = false;
    setIsSubmitting(false);

    if (result.error) {
      if (result.requiereExcepcion) setForzarExcepcion(true);
      setError(result.error);
      return;
    }

    router.refresh();
    onDone(
      accion === "cancelar"
        ? `Compra cancelada: se descontaron ${result.puntosAnulados ?? compra.cantidad} pts.`
        : `Compra corregida: ${result.puntosAnulados ?? compra.cantidad} pts → ${result.puntosNuevos ?? puntosNuevos} pts.`
    );
  }

  return (
    <Modal titleId={titleId} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left" noValidate>
        <div className="pr-10">
          <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
            Corregir o cancelar compra
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">
            {compra.producto_nombre ?? "Compra en tienda"}
            {compra.monto !== null && <> · {pesosFormatter.format(compra.monto)}</>} · {compra.cantidad} pts ·{" "}
            {dateFormatter.format(new Date(fechaCompraRaiz))}
          </p>
        </div>

        {fueraDePlazo && role === "admin" && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 font-sans text-sm text-amber-900">
            <p className="font-semibold">Fuera de política</p>
            <p className="mt-1">
              La compra tiene más de {CLUB57_PLAZO_CORRECCION_DIAS} días naturales
              {diasDesdeCompra > CLUB57_PLAZO_CORRECCION_DIAS && <> ({diasDesdeCompra} días)</>}. Solo procede como
              excepción y quedará marcada en la bitácora.
            </p>
          </div>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className={labelClass}>¿Qué quieres hacer?</legend>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-brand-slate/20 px-3 py-2.5 font-sans text-sm has-[:checked]:border-brand-slate">
            <input
              type="radio"
              name="accion"
              value="cancelar"
              checked={accion === "cancelar"}
              onChange={() => setAccion("cancelar")}
              className="mt-0.5 accent-brand-slate"
            />
            <span>
              <span className="font-medium text-brand-black">Cancelar la compra</span>
              <span className="block text-brand-slate/70">Se descuentan sus {compra.cantidad} pts.</span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-brand-slate/20 px-3 py-2.5 font-sans text-sm has-[:checked]:border-brand-slate">
            <input
              type="radio"
              name="accion"
              value="corregir"
              checked={accion === "corregir"}
              onChange={() => setAccion("corregir")}
              className="mt-0.5 accent-brand-slate"
            />
            <span>
              <span className="font-medium text-brand-black">Corregir monto o producto</span>
              <span className="block text-brand-slate/70">Se recalculan los puntos con el nuevo monto.</span>
            </span>
          </label>
        </fieldset>

        {accion === "corregir" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="sm:col-span-2">
              <label htmlFor={productoId} className={labelClass}>
                Producto
              </label>
              <input
                id={productoId}
                type="text"
                value={producto}
                onChange={(event) => setProducto(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={codigoId} className={labelClass}>
                Código (opcional)
              </label>
              <input
                id={codigoId}
                type="text"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={montoId} className={labelClass}>
                Monto (MXN)
              </label>
              <input
                id={montoId}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                className={inputClass}
              />
            </div>
            {puntosNuevos !== null && (
              <p className="font-sans text-sm text-brand-slate sm:col-span-2">
                Puntos: {compra.cantidad} → <strong className="text-brand-black">{puntosNuevos}</strong>
              </p>
            )}
          </div>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className={labelClass}>Motivo</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CLUB57_MOTIVOS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-brand-slate/20 px-3 py-2 font-sans text-sm text-brand-black has-[:checked]:border-brand-slate"
              >
                <input
                  type="radio"
                  name="motivo"
                  value={option.value}
                  checked={motivo === option.value}
                  onChange={() => setMotivo(option.value)}
                  className="accent-brand-slate"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {motivo === "otro" && (
          <div>
            <label htmlFor={notaId} className={labelClass}>
              Describe el motivo
            </label>
            <textarea
              id={notaId}
              rows={2}
              maxLength={300}
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              className={inputClass}
            />
            <p className="mt-1 font-sans text-xs text-brand-slate/70">El cliente verá este texto en su historial.</p>
          </div>
        )}

        {fueraDePlazo && role === "admin" && (
          <div className="flex flex-col gap-3 rounded-md border border-amber-300 p-3">
            <label htmlFor={confirmId} className="flex cursor-pointer items-start gap-3 font-sans text-sm text-brand-black">
              <input
                id={confirmId}
                type="checkbox"
                checked={confirmaExcepcion}
                onChange={(event) => setConfirmaExcepcion(event.target.checked)}
                className="mt-0.5 size-4 accent-brand-slate"
              />
              Confirmo que es una excepción a la política de {CLUB57_PLAZO_CORRECCION_DIAS} días.
            </label>
            <div>
              <label htmlFor={justificacionId} className={labelClass}>
                Justificación (interna)
              </label>
              <textarea
                id={justificacionId}
                rows={3}
                maxLength={500}
                value={justificacion}
                onChange={(event) => setJustificacion(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 font-sans text-xs text-brand-slate/70">
                Solo la ve el personal en la bitácora; el cliente no la ve.
              </p>
            </div>
          </div>
        )}

        <p className="font-sans text-sm text-brand-slate">
          El cliente verá en su historial que la compra fue {accion === "cancelar" ? "cancelada" : "corregida"} y el
          motivo.{" "}
          {descuentaDisponibles
            ? "Sus puntos ya estaban disponibles: el cambio se aplica a su saldo de inmediato, aunque quede negativo."
            : "Sus puntos todavía estaban pendientes: el cambio se aplica a sus puntos pendientes."}
        </p>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonClassName("secondary", "w-full sm:w-auto")}>
            Volver
          </button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Guardando…" : accion === "cancelar" ? "Cancelar compra" : "Guardar corrección"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
