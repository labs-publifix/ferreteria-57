"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Modal } from "@/components/ui";
import { grantClub57CortesiaPoints } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";
import { CLUB57_MOTIVOS_CORTESIA, validarOtorgamiento, type Club57MotivoCortesia } from "@/lib/club57/cortesias";
import { newRequestId } from "@/lib/club57/requestId";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

// Otorgar puntos de cortesía desde el detalle del cliente (admin y
// operador). Qué se permite lo decide club57_otorgar_puntos() en la base;
// aquí se valida antes solo para dar el mensaje al momento.
export function Club57GrantCortesia({
  memberId,
  memberName,
  saldoDisponible,
  maxPuntos,
}: {
  memberId: string;
  memberName: string;
  saldoDisponible: number;
  maxPuntos: number;
}) {
  const [open, setOpen] = useState(false);
  // El aviso guarda el saldo con el que quedó el cliente: si el saldo
  // cambia después (otra compra, una anulación), el aviso ya no aplica y se
  // oculta en vez de mostrar un saldo viejo.
  const [notice, setNotice] = useState<{ text: string; saldo: number | null } | null>(null);
  const noticeVigente = notice && (notice.saldo === null || notice.saldo === saldoDisponible) ? notice.text : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose font-sans text-sm text-brand-slate/80">
        Puntos de regalo por una compensación, promoción o agradecimiento. Quedan disponibles para canje de inmediato.
        Máximo {maxPuntos} pts por otorgamiento.
      </p>
      {noticeVigente && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          {noticeVigente}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setNotice(null);
          setOpen(true);
        }}
        className={buttonClassName("secondary", "w-full sm:w-auto sm:self-start")}
      >
        Otorgar puntos
      </button>
      {open && (
        <GrantDialog
          memberId={memberId}
          memberName={memberName}
          saldoDisponible={saldoDisponible}
          maxPuntos={maxPuntos}
          onClose={() => setOpen(false)}
          onDone={(message, saldo) => {
            setOpen(false);
            setNotice({ text: message, saldo });
          }}
        />
      )}
    </div>
  );
}

function GrantDialog({
  memberId,
  memberName,
  saldoDisponible,
  maxPuntos,
  onClose,
  onDone,
}: {
  memberId: string;
  memberName: string;
  saldoDisponible: number;
  maxPuntos: number;
  onClose: () => void;
  onDone: (message: string, saldo: number | null) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const puntosId = useId();
  const notaId = useId();
  const [puntos, setPuntos] = useState("");
  const [motivo, setMotivo] = useState<Club57MotivoCortesia | "">("");
  const [nota, setNota] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Doble clic: el ref frena el segundo envío y la llave hace que el
  // servidor devuelva el otorgamiento ya hecho si aun así llegara.
  const submittingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);

  const puntosNumber = /^\d+$/.test(puntos.trim()) ? Number(puntos.trim()) : null;
  const puntosValidos = puntosNumber !== null && puntosNumber > 0 && puntosNumber <= maxPuntos;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError(null);

    const validationError = validarOtorgamiento({ puntos, motivo, nota, max: maxPuntos });
    if (validationError) {
      setError(validationError);
      return;
    }

    submittingRef.current = true;
    requestIdRef.current ??= newRequestId();
    setIsSubmitting(true);
    const result = await grantClub57CortesiaPoints({
      memberId,
      puntos,
      motivo,
      motivoNota: nota,
      requestId: requestIdRef.current,
    });
    submittingRef.current = false;
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    const saldo = typeof result.saldoDisponible === "number" ? result.saldoDisponible : null;
    onDone(
      `Se otorgaron ${result.puntos ?? puntosNumber} pts de cortesía a ${memberName}.` +
        (saldo !== null ? ` Saldo disponible: ${saldo} pts.` : ""),
      saldo
    );
  }

  return (
    <Modal titleId={titleId} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left" noValidate>
        <div className="pr-10">
          <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
            Otorgar puntos de cortesía
          </h2>
          <p className="mt-1 font-sans text-sm text-brand-slate/80">
            {memberName} · saldo disponible: {saldoDisponible} pts
          </p>
        </div>

        <div>
          <label htmlFor={puntosId} className={labelClass}>
            Puntos a otorgar
          </label>
          <input
            id={puntosId}
            type="number"
            min="1"
            max={maxPuntos}
            step="1"
            inputMode="numeric"
            value={puntos}
            onChange={(event) => setPuntos(event.target.value)}
            className={inputClass}
            aria-describedby={`${puntosId}-hint`}
          />
          <p id={`${puntosId}-hint`} className="mt-1 font-sans text-xs text-brand-slate/70">
            Número entero, máximo {maxPuntos} pts.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={labelClass}>Motivo</legend>
          <div className="grid grid-cols-1 gap-2">
            {CLUB57_MOTIVOS_CORTESIA.map((option) => (
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

        <div>
          <label htmlFor={notaId} className={labelClass}>
            Nota interna {motivo === "otro" ? "" : "(opcional)"}
          </label>
          <textarea
            id={notaId}
            rows={2}
            maxLength={300}
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Solo la ve el personal en la bitácora; el cliente ve el motivo, no la nota.
            {motivo === "otro" && " Con «Otro», describe el motivo aquí."}
          </p>
        </div>

        {puntosValidos && (
          <p className="rounded-md bg-brand-gray px-4 py-3 font-sans text-sm text-brand-black">
            El saldo disponible de {memberName} pasará de <strong>{saldoDisponible}</strong> a{" "}
            <strong>{saldoDisponible + puntosNumber!}</strong> pts.
          </p>
        )}

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
            {isSubmitting ? "Otorgando…" : puntosValidos ? `Otorgar ${puntosNumber} pts` : "Otorgar puntos"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
