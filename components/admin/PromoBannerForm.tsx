"use client";

import { useId, useState } from "react";
import { Button, Select } from "@/components/ui";
import { PromoCard } from "@/components/home/PromoCard";
import { SingleImageUploader } from "./SingleImageUploader";
import { PROMO_THEME_OPTIONS } from "@/lib/marketing/theme";
import {
  createPromoBanner,
  updatePromoBanner,
  type PromoBannerActionResult,
} from "@/app/(admin)/admin/(protected)/promo-banners/actions";
import type { PromoBanner, PromoColorTheme } from "@/types/marketing";

const MAX_LENGTHS = { eyebrow: 20, title: 35, subtitle: 60, fineprint: 40 };

interface PromoBannerFormValues {
  eyebrow: string;
  title: string;
  subtitle: string;
  fineprint: string;
  href: string;
  colorTheme: PromoColorTheme;
  imageUrl: string | null;
  position: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const EMPTY_VALUES: PromoBannerFormValues = {
  eyebrow: "",
  title: "",
  subtitle: "",
  fineprint: "",
  href: "",
  colorTheme: "naranja",
  imageUrl: null,
  position: 0,
  startsAt: "",
  endsAt: "",
  active: true,
};

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "font-sans text-sm font-medium text-brand-black";

// Contador "n/max" en vivo + maxLength nativo del input/textarea: el
// límite es físicamente imposible de superar al escribir (no hace falta
// bloquear nada por JS), el contador solo avisa qué tan cerca se está.
function CharLimitedField({
  id,
  label,
  value,
  onChange,
  maxLength,
  required = false,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
  multiline?: boolean;
}) {
  const atLimit = value.length >= maxLength;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <span className={`font-sans text-xs ${atLimit ? "font-semibold text-red-700" : "text-brand-slate/60"}`}>
          {value.length}/{maxLength}
        </span>
      </div>
      {multiline ? (
        <textarea
          id={id}
          required={required}
          maxLength={maxLength}
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function PromoBannerForm({
  mode,
  promoBannerId,
  initialValues,
}: {
  mode: "create" | "edit";
  promoBannerId?: string;
  initialValues?: PromoBannerFormValues;
}) {
  const eyebrowId = useId();
  const titleId = useId();
  const subtitleId = useId();
  const fineprintId = useId();
  const hrefId = useId();
  const positionId = useId();
  const startsAtId = useId();
  const endsAtId = useId();
  const activeId = useId();

  const [values, setValues] = useState<PromoBannerFormValues>(initialValues ?? EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSchedule = Boolean(values.startsAt || values.endsAt);

  // Objeto de PromoBanner "de mentiras" solo para alimentar la misma
  // PromoCard que usa el sitio público — la vista previa es honesta
  // (mismas clases, mismo componente), no una aproximación aparte.
  const previewPromo: PromoBanner = {
    id: "preview",
    eyebrow: values.eyebrow || null,
    title: values.title || "Título de la tarjeta",
    subtitle: values.subtitle || null,
    fineprint: values.fineprint || null,
    href: values.href || "#",
    colorTheme: values.colorTheme,
    imageUrl: values.imageUrl,
    position: values.position,
    startsAt: null,
    endsAt: null,
    active: true,
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("eyebrow", values.eyebrow);
    formData.set("title", values.title);
    formData.set("subtitle", values.subtitle);
    formData.set("fineprint", values.fineprint);
    formData.set("href", values.href);
    formData.set("colorTheme", values.colorTheme);
    formData.set("imageUrl", values.imageUrl ?? "");
    formData.set("position", String(values.position));
    formData.set("startsAt", values.startsAt);
    formData.set("endsAt", values.endsAt);
    if (values.active) formData.set("active", "on");

    const result: PromoBannerActionResult =
      mode === "create"
        ? await createPromoBanner(formData)
        : await updatePromoBanner(promoBannerId!, formData);

    // En éxito, la Server Action redirige a /admin/promo-banners — solo se
    // llega aquí de vuelta si hubo un error.
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}

        <CharLimitedField
          id={eyebrowId}
          label="Eyebrow (opcional)"
          value={values.eyebrow}
          onChange={(eyebrow) => setValues((current) => ({ ...current, eyebrow }))}
          maxLength={MAX_LENGTHS.eyebrow}
        />

        <CharLimitedField
          id={titleId}
          label="Título"
          value={values.title}
          onChange={(title) => setValues((current) => ({ ...current, title }))}
          maxLength={MAX_LENGTHS.title}
          required
        />

        <CharLimitedField
          id={subtitleId}
          label="Subtítulo (opcional)"
          value={values.subtitle}
          onChange={(subtitle) => setValues((current) => ({ ...current, subtitle }))}
          maxLength={MAX_LENGTHS.subtitle}
          multiline
        />

        <CharLimitedField
          id={fineprintId}
          label="Fineprint (opcional)"
          value={values.fineprint}
          onChange={(fineprint) => setValues((current) => ({ ...current, fineprint }))}
          maxLength={MAX_LENGTHS.fineprint}
        />

        <div>
          <label htmlFor={hrefId} className={`mb-1.5 block ${labelClass}`}>
            URL de destino
          </label>
          <input
            id={hrefId}
            type="text"
            required
            placeholder="/categoria/herramienta"
            value={values.href}
            onChange={(event) => setValues((current) => ({ ...current, href: event.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <span className={`mb-1.5 block ${labelClass}`}>Tema de color</span>
          <Select
            value={values.colorTheme}
            onChange={(value) => setValues((current) => ({ ...current, colorTheme: value as PromoColorTheme }))}
            options={PROMO_THEME_OPTIONS}
            label="Tema de color"
            className="max-w-xs"
          />
        </div>

        <SingleImageUploader
          bucket="promo-images"
          value={values.imageUrl}
          onChange={(imageUrl) => setValues((current) => ({ ...current, imageUrl }))}
          label="Imagen (opcional)"
        />

        <div>
          <label htmlFor={positionId} className={`mb-1.5 block ${labelClass}`}>
            Posición
          </label>
          <input
            id={positionId}
            type="number"
            value={values.position}
            onChange={(event) =>
              setValues((current) => ({ ...current, position: Number(event.target.value) }))
            }
            className={`${inputClass} w-32`}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Un número más chico aparece primero en el riel.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={startsAtId} className={`mb-1.5 block ${labelClass}`}>
              Vigente desde (opcional)
            </label>
            <input
              id={startsAtId}
              type="date"
              value={values.startsAt}
              onChange={(event) => setValues((current) => ({ ...current, startsAt: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={endsAtId} className={`mb-1.5 block ${labelClass}`}>
              Vigente hasta (opcional)
            </label>
            <input
              id={endsAtId}
              type="date"
              value={values.endsAt}
              onChange={(event) => setValues((current) => ({ ...current, endsAt: event.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <label
          htmlFor={activeId}
          className={`flex min-h-11 items-center gap-2 ${hasSchedule ? "opacity-50" : ""}`}
        >
          <input
            id={activeId}
            type="checkbox"
            disabled={hasSchedule}
            checked={values.active}
            onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          <span className="font-sans text-sm text-brand-black">Activa (visible en el Home)</span>
        </label>
        {hasSchedule && (
          <p className="-mt-2 font-sans text-xs text-brand-slate/70">
            Hay fechas de vigencia configuradas: mandan ellas solas sobre si la tarjeta se muestra o no,
            este interruptor no aplica mientras tengan un valor. Sin fecha de fin, la tarjeta queda
            permanente desde su fecha de inicio.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
          {isSubmitting ? "Guardando…" : mode === "create" ? "Crear tarjeta" : "Guardar cambios"}
        </Button>
      </form>

      {/* Vista previa: misma PromoCard del sitio público, no interactiva
          aquí (pointer-events-none) para que un clic no navegue fuera del
          formulario mientras se está editando. */}
      <div className="flex flex-col gap-1.5 lg:sticky lg:top-6">
        <span className={labelClass}>Vista previa</span>
        <div className="pointer-events-none flex justify-center rounded-lg bg-brand-gray p-6">
          <PromoCard promo={previewPromo} />
        </div>
      </div>
    </div>
  );
}
