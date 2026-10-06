"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui";
import type { PromoTipo } from "@/lib/club57/promociones/config";
import { formatBytes } from "@/lib/club57/promociones/archivo";
import {
  PROMO_ESTADO_BADGE_CLASS,
  PROMO_ESTADO_LABEL,
  formatRangoLegible,
  promoEstadoVisible,
} from "@/lib/club57/promociones/vigencia";
import {
  deletePromoDraft,
  publishPromo,
  setPromoVigencia,
  updatePromoTitulo,
} from "@/app/(admin)/admin/(protected)/lealtad/promociones/actions";
import { PromoFileDropzone, type UploadedPromoDraft } from "./PromoFileDropzone";
import {
  PromoRangePicker,
  promoRangeConflict,
  type PromoPublicadaRef,
  type PromoRangoParcial,
} from "./PromoRangePicker";
import { PromoPublishedConfirmation, type PromoPublishedSummary } from "./PromoPublishedConfirmation";

const STEPS = ["Archivo", "Vigencia", "Revisión", "Confirmación"] as const;

export interface PromoWizardDraft extends UploadedPromoDraft {
  inicio: string | null;
  fin: string | null;
}

export function PromoWizard({
  tipo,
  formato,
  tipoLabel,
  listHref,
  hoy,
  publicadas,
  initialDraft,
}: {
  tipo: PromoTipo;
  formato: "pdf" | "excel";
  tipoLabel: string;
  listHref: string;
  hoy: string;
  publicadas: PromoPublicadaRef[];
  initialDraft: PromoWizardDraft | null;
}) {
  const router = useRouter();
  const tituloId = useId();
  const [step, setStep] = useState(initialDraft ? 2 : 1);
  const [draft, setDraft] = useState<UploadedPromoDraft | null>(initialDraft);
  const [titulo, setTitulo] = useState(initialDraft?.titulo ?? "");
  const [rango, setRango] = useState<PromoRangoParcial>({
    inicio: initialDraft?.inicio ?? undefined,
    fin: initialDraft?.fin ?? undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<PromoPublishedSummary | null>(null);

  const tituloLimpio = titulo.replace(/\s+/g, " ").trim();
  const tituloValido = tituloLimpio.length >= 3 && tituloLimpio.length <= 80;
  const conflict = promoRangeConflict(rango, publicadas, draft?.id);
  const rangoCompleto = rango.inicio && rango.fin ? { inicio: rango.inicio, fin: rango.fin } : null;

  async function run(action: () => Promise<{ error?: string } | void>, next?: () => void) {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result && result.error) setError(result.error);
      else next?.();
    } catch {
      setError("Algo salió mal. Revisa tu conexión e intenta de nuevo.");
    }
    setBusy(false);
  }

  function goToStep(target: number) {
    setError(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReplaceDraft() {
    if (!draft) return;
    const previous = draft;
    setDraft(null);
    await deletePromoDraft(previous.id);
  }

  function handleContinueFromFile() {
    if (!draft || !tituloValido) return;
    if (tituloLimpio === draft.titulo) return goToStep(2);
    void run(
      () => updatePromoTitulo(draft.id, tituloLimpio),
      () => {
        setDraft({ ...draft, titulo: tituloLimpio });
        goToStep(2);
      }
    );
  }

  function handleContinueFromDates() {
    if (!draft || !rangoCompleto || conflict) return;
    void run(
      async () => {
        const result = await setPromoVigencia(draft.id, rangoCompleto.inicio, rangoCompleto.fin);
        // Liquidaciones: el PDF se regeneró con las fechas — la revisión
        // debe mostrar el archivo nuevo.
        if (result.archivo) setDraft({ ...draft, ...result.archivo });
        return result;
      },
      () => goToStep(3)
    );
  }

  function handlePublish() {
    if (!draft || !rangoCompleto) return;
    void run(
      async () => {
        const result = await publishPromo(draft.id);
        if (result.publicada) {
          setPublished({
            tipoLabel,
            titulo: draft.titulo,
            inicio: result.publicada.inicio,
            fin: result.publicada.fin,
            estadoVisible: result.publicada.estadoVisible,
          });
          router.refresh();
        }
        return result;
      },
      () => goToStep(4)
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Pasos para cargar la promoción">
        <p className="font-sans text-sm font-semibold text-brand-slate">
          Paso {step} de {STEPS.length} · {STEPS[step - 1]}
        </p>
        <ol className="mt-2 grid grid-cols-4 gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={index + 1 === step ? "step" : undefined}>
              <span className="sr-only">
                {label}
                {index + 1 < step ? " (completado)" : ""}
              </span>
              <span
                aria-hidden="true"
                className={`block h-1.5 rounded-full ${index + 1 <= step ? "bg-brand-orange" : "bg-brand-slate/20"}`}
              />
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-base uppercase text-brand-slate">Archivo</h2>
              <p className="mt-1 font-sans text-sm text-brand-slate">
                {formato === "excel"
                  ? "Sube el Excel de la liquidación: es la fuente de verdad. La plataforma genera el PDF de marca que descargan los miembros, con el precio con impuestos y en el mismo orden del Excel."
                  : "Sube el PDF tal cual lo van a recibir los miembros: se guarda sin cambios y ya no se puede reemplazar una vez publicado."}
              </p>
            </div>

            <PromoFileDropzone
              tipo={tipo}
              formato={formato}
              draft={draft}
              onUploaded={(uploaded) => {
                setDraft(uploaded);
                setTitulo(uploaded.titulo);
              }}
              onBeforeReplace={handleReplaceDraft}
            />

            {draft && (
              <div>
                <label htmlFor={tituloId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
                  Nombre interno
                </label>
                <input
                  id={tituloId}
                  type="text"
                  value={titulo}
                  maxLength={80}
                  onChange={(event) => setTitulo(event.target.value)}
                  aria-describedby={`${tituloId}-ayuda`}
                  className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-base text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
                />
                <p id={`${tituloId}-ayuda`} className="mt-1 flex justify-between gap-3 font-sans text-xs text-brand-slate">
                  <span>Solo lo ve el equipo — los miembros no lo ven. Entre 3 y 80 caracteres.</span>
                  <span aria-hidden="true">{tituloLimpio.length}/80</span>
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-display text-base uppercase text-brand-slate">Vigencia</h2>
              <p className="mt-1 font-sans text-sm text-brand-slate">
                Los miembros pueden descargarla desde las 00:00 del primer día hasta las 23:59 del último (hora
                del centro de México).
                {formato === "excel" && " Al continuar se genera el PDF con estas fechas impresas."}
              </p>
            </div>
            <PromoRangePicker
              hoy={hoy}
              minDate={hoy}
              value={rango}
              onChange={setRango}
              publicadas={publicadas}
              excludeId={draft?.id}
            />
          </div>
        )}

        {step === 3 && draft && rangoCompleto && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-base uppercase text-brand-slate">Revisión</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 font-sans text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-semibold text-brand-slate">Tipo</dt>
              <dd className="text-brand-black">{tipoLabel}</dd>
              <dt className="font-semibold text-brand-slate">Nombre interno</dt>
              <dd className="break-words text-brand-black">{draft.titulo}</dd>
              {draft.fuente && (
                <>
                  <dt className="font-semibold text-brand-slate">Excel</dt>
                  <dd className="break-words text-brand-black">
                    {draft.fuente.nombre} · {draft.fuente.productos}{" "}
                    {draft.fuente.productos === 1 ? "producto" : "productos"}
                  </dd>
                </>
              )}
              <dt className="font-semibold text-brand-slate">{draft.fuente ? "PDF generado" : "Archivo"}</dt>
              <dd className="break-words text-brand-black">
                {draft.nombre} · {formatBytes(draft.bytes)}
              </dd>
              <dt className="font-semibold text-brand-slate">Vigencia</dt>
              <dd className="text-brand-black">{formatRangoLegible(rangoCompleto)}</dd>
              <dt className="font-semibold text-brand-slate">Al publicar quedará</dt>
              <dd>
                {(() => {
                  const estado = promoEstadoVisible(rangoCompleto, hoy);
                  return (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PROMO_ESTADO_BADGE_CLASS[estado]}`}>
                      {PROMO_ESTADO_LABEL[estado]}
                    </span>
                  );
                })()}
              </dd>
            </dl>

            <div className="flex flex-col gap-2">
              <iframe
                src={`/api/admin/lealtad/promociones/${draft.id}/vista-previa?v=${draft.sha256.slice(0, 12)}`}
                title={`Vista previa de ${draft.nombre}`}
                className="h-[420px] w-full rounded-md border border-brand-slate/15 bg-brand-gray sm:h-[560px]"
              />
              <a
                href={`/api/admin/lealtad/promociones/${draft.id}/vista-previa?v=${draft.sha256.slice(0, 12)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 self-start font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
              >
                <ExternalLink className="size-4" aria-hidden="true" strokeWidth={1.75} />
                Abrir el PDF en otra pestaña
              </a>
            </div>
          </div>
        )}

        {step === 4 && published && <PromoPublishedConfirmation summary={published} listHref={listHref} />}

        {error && (
          <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {step < 4 && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {step === 1 ? (
            <Link href={listHref} className={buttonClassName("secondary", "w-full sm:w-auto")}>
              {draft ? "Guardar borrador y salir" : "Cancelar"}
            </Link>
          ) : (
            <Button variant="secondary" className="w-full sm:w-auto" disabled={busy} onClick={() => goToStep(step - 1)}>
              Atrás
            </Button>
          )}

          {step === 1 && (
            <Button className="w-full sm:w-auto" disabled={!draft || !tituloValido || busy} onClick={handleContinueFromFile}>
              {busy ? "Guardando…" : "Continuar"}
            </Button>
          )}
          {step === 2 && (
            <Button
              className="w-full sm:w-auto"
              disabled={!rangoCompleto || Boolean(conflict) || busy}
              onClick={handleContinueFromDates}
            >
              {busy ? (formato === "excel" ? "Generando PDF…" : "Validando…") : "Continuar"}
            </Button>
          )}
          {step === 3 && (
            <Button className="w-full sm:w-auto" disabled={busy} onClick={handlePublish}>
              {busy ? "Publicando…" : "Publicar"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
