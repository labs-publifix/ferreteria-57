"use client";

import { useId, useState } from "react";
import { Button, Select } from "@/components/ui";
import { TOP_BANNER_THEME_CLASSES, TOP_BANNER_THEME_OPTIONS } from "@/lib/marketing/theme";
import { updateTopBannerConfig } from "@/app/(admin)/admin/(protected)/top-banner/actions";
import type { TopBannerTheme } from "@/types/marketing";

interface TopBannerFormValues {
  message: string;
  colorTheme: TopBannerTheme;
  href: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

export function TopBannerForm({ initialValues }: { initialValues: TopBannerFormValues }) {
  const messageId = useId();
  const hrefId = useId();
  const startsAtId = useId();
  const endsAtId = useId();
  const activeId = useId();

  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasSchedule = Boolean(values.startsAt || values.endsAt);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("message", values.message);
    formData.set("colorTheme", values.colorTheme);
    formData.set("href", values.href);
    formData.set("startsAt", values.startsAt);
    formData.set("endsAt", values.endsAt);
    if (values.active) formData.set("active", "on");

    const result = await updateTopBannerConfig(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6 sm:max-w-2xl">
      {/* Vista previa en vivo: exactamente el mismo componente/clases que
          usa el sitio público (TOP_BANNER_THEME_CLASSES), así lo que se ve
          aquí es lo que se va a ver de verdad al guardar — no una
          aproximación. */}
      <div>
        <p className={labelClass}>Vista previa</p>
        <div className={`overflow-hidden rounded-lg ${TOP_BANNER_THEME_CLASSES[values.colorTheme]}`}>
          <p className="px-4 py-1.5 text-center font-sans text-xs leading-snug sm:text-sm">
            {values.message || "Escribe un mensaje para verlo aquí…"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
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
          <label htmlFor={messageId} className={labelClass}>
            Mensaje
          </label>
          <textarea
            id={messageId}
            required
            rows={2}
            value={values.message}
            onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>Tema de color</span>
          <Select
            value={values.colorTheme}
            onChange={(value) => setValues((current) => ({ ...current, colorTheme: value as TopBannerTheme }))}
            options={TOP_BANNER_THEME_OPTIONS}
            label="Tema de color"
            className="max-w-xs"
          />
        </div>

        <div>
          <label htmlFor={hrefId} className={labelClass}>
            URL de destino (opcional)
          </label>
          <input
            id={hrefId}
            type="text"
            placeholder="/categoria/herramienta, tel:+524427782708, https://wa.me/…"
            value={values.href}
            onChange={(event) => setValues((current) => ({ ...current, href: event.target.value }))}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Sin URL, el mensaje se muestra sin poder darle clic. Acepta rutas del sitio (/categoria/…),
            teléfono (tel:…) o WhatsApp (https://wa.me/…).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={startsAtId} className={labelClass}>
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
            <label htmlFor={endsAtId} className={labelClass}>
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
          <span className="font-sans text-sm text-brand-black">Activo (visible en el sitio)</span>
        </label>
        {hasSchedule && (
          <p className="-mt-2 font-sans text-xs text-brand-slate/70">
            Hay fechas de vigencia configuradas: mandan ellas solas sobre si el banner se muestra o no,
            este interruptor no aplica mientras tengan un valor.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
