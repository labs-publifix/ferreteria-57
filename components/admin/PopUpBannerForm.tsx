"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button, DateTimePicker } from "@/components/ui";
import { PopupBannerCardContent, type PopupCardContentData } from "@/components/layout/PopupBannerCard";
import { PopupImageUploader } from "./PopupImageUploader";
import { contrastRatio } from "@/lib/popup/contrast";
import { mexicoCityInputValueToUtcIso, utcIsoToMexicoCityInputValue } from "@/lib/popup/timezone";
import {
  createPopupBanner,
  setPopupBannerActive,
  updatePopupBanner,
  type PopupBannerActionResult,
} from "@/app/(admin)/admin/(protected)/pop-up-banner/actions";
import type { PopupBackgroundType } from "@/types/popup";

const MAX_LENGTHS = { nombre: 60, titulo: 35, texto: 100, ctaLabel: 20 };

interface PopUpBannerFormValues {
  nombre: string;
  titulo: string;
  texto: string;
  ctaLabel: string;
  ctaUrl: string;
  tipoFondo: PopupBackgroundType;
  colorFondo: string;
  colorTexto: string;
  colorBoton: string;
  colorTextoBoton: string;
  imagenUrl: string | null;
  textoAlternativo: string;
  /** Valor de <input type="datetime-local">, hora de pared CDMX. */
  startsAtInput: string;
  endsAtInput: string;
  activo: boolean;
}

// Punto de partida razonable para un banner nuevo: empieza ahora mismo,
// termina en 24h — el admin ajusta desde ahí en vez de partir de campos
// vacíos que obligarían a escribir fecha Y hora a mano de cero.
function defaultValues(): PopUpBannerFormValues {
  const now = new Date();
  const inHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    nombre: "",
    titulo: "",
    texto: "",
    ctaLabel: "",
    ctaUrl: "",
    tipoFondo: "solido",
    colorFondo: "#1A1A1A",
    colorTexto: "#FFFFFF",
    colorBoton: "#FF6A00",
    colorTextoBoton: "#1A1A1A",
    imagenUrl: null,
    textoAlternativo: "",
    startsAtInput: utcIsoToMexicoCityInputValue(now.toISOString()),
    endsAtInput: utcIsoToMexicoCityInputValue(inHours.toISOString()),
    activo: false,
  };
}

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "font-sans text-sm font-medium text-brand-black";

// Contador "n/max" + maxLength nativo — mismo patrón que CharLimitedField
// en PromoBannerForm.tsx, recreado aquí porque ese componente no está
// exportado (no se puede importar sin modificar ese archivo).
function CharLimitedField({
  id,
  label,
  value,
  onChange,
  maxLength,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
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
      <input
        id={id}
        type="text"
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={`mb-1.5 block ${labelClass}`}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-md border border-brand-slate/30 p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} (código hexadecimal)`}
          className={`${inputClass} font-mono uppercase`}
          maxLength={7}
        />
      </div>
    </div>
  );
}

function ContrastWarning({ ratio, label }: { ratio: number; label: string }) {
  if (ratio >= 4.5) return null;
  return (
    <p className="flex items-start gap-1.5 font-sans text-xs text-amber-800">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" strokeWidth={2} />
      Contraste de {label} insuficiente (ratio {ratio.toFixed(1)}:1, WCAG AA pide al menos 4.5:1) — el texto
      puede costar trabajo leer.
    </p>
  );
}

export function PopUpBannerForm({
  mode,
  bannerId,
  initialValues,
  initialActivo,
}: {
  mode: "create" | "edit";
  bannerId?: string;
  initialValues?: PopUpBannerFormValues;
  /** Solo para el botón "Retirar ahora" — estado real guardado, no el del formulario sin confirmar. */
  initialActivo?: boolean;
}) {
  const router = useRouter();
  const nombreId = useId();
  const tituloId = useId();
  const textoId = useId();
  const ctaLabelId = useId();
  const ctaUrlId = useId();
  const colorFondoId = useId();
  const colorTextoId = useId();
  const colorBotonId = useId();
  const colorTextoBotonId = useId();
  const textoAltId = useId();
  const startsAtId = useId();
  const endsAtId = useId();
  const activoId = useId();

  const [values, setValues] = useState<PopUpBannerFormValues>(initialValues ?? defaultValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyActive, setCurrentlyActive] = useState(initialActivo ?? false);

  const previewData: PopupCardContentData = {
    titulo: values.titulo || "Título del banner",
    texto: values.texto || "Escribe aquí el texto de la promoción.",
    ctaLabel: values.ctaLabel || null,
    ctaUrl: values.ctaUrl || null,
    tipoFondo: values.tipoFondo,
    colorFondo: values.colorFondo,
    colorTexto: values.colorTexto,
    colorBoton: values.colorBoton,
    colorTextoBoton: values.colorTextoBoton,
    imagenUrl: values.imagenUrl,
    textoAlternativo: values.textoAlternativo || null,
  };

  // Con fondo de imagen el texto siempre se pinta blanco sobre la capa
  // degradada oscura (ver PopupBannerCard) — el contraste que importa ahí
  // es blanco contra un negro de referencia (lo que garantiza el
  // degradado), no contra colorFondo (que ni se usa en ese caso).
  const textContrast = useMemo(
    () => contrastRatio(values.colorTexto, values.tipoFondo === "imagen" ? "#000000" : values.colorFondo),
    [values.colorTexto, values.colorFondo, values.tipoFondo]
  );
  const buttonContrast = useMemo(
    () => contrastRatio(values.colorTextoBoton, values.colorBoton),
    [values.colorTextoBoton, values.colorBoton]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("nombre", values.nombre);
    formData.set("titulo", values.titulo);
    formData.set("texto", values.texto);
    formData.set("ctaLabel", values.ctaLabel);
    formData.set("ctaUrl", values.ctaUrl);
    formData.set("tipoFondo", values.tipoFondo);
    formData.set("colorFondo", values.colorFondo);
    formData.set("colorTexto", values.colorTexto);
    formData.set("colorBoton", values.colorBoton);
    formData.set("colorTextoBoton", values.colorTextoBoton);
    formData.set("imagenUrl", values.imagenUrl ?? "");
    formData.set("textoAlternativo", values.textoAlternativo);
    formData.set("startsAt", values.startsAtInput);
    formData.set("endsAt", values.endsAtInput);
    if (values.activo) formData.set("activo", "on");

    // Un try/catch aquí es indispensable: si algo del lado del servidor
    // truena de forma inesperada (p. ej. un error real de red, no uno de
    // validación que ya vuelve como { error }), sin este catch el botón se
    // queda en "Guardando…" para siempre sin ningún aviso — el problema
    // reportado por el cliente. La navegación de vuelta al listado la hace
    // este componente (no un redirect() dentro de la Server Action) para
    // que cualquier falla real caiga siempre aquí, nunca en un throw sin
    // capturar.
    try {
      const result: PopupBannerActionResult =
        mode === "create" ? await createPopupBanner(formData) : await updatePopupBanner(bannerId!, formData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/admin/pop-up-banner");
    } catch {
      setError("Ocurrió un error inesperado al guardar. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  }

  async function handleRetireNow() {
    if (!bannerId) return;
    setIsRetiring(true);
    setError(null);
    try {
      const result = await setPopupBannerActive(bannerId, false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCurrentlyActive(false);
      setValues((current) => ({ ...current, activo: false }));
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setIsRetiring(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6"
        noValidate
      >
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
            {error}
          </p>
        )}

        <CharLimitedField
          id={nombreId}
          label="Nombre interno (para identificarlo en este listado)"
          value={values.nombre}
          onChange={(nombre) => setValues((current) => ({ ...current, nombre }))}
          maxLength={MAX_LENGTHS.nombre}
          required
        />

        <CharLimitedField
          id={tituloId}
          label="Título"
          value={values.titulo}
          onChange={(titulo) => setValues((current) => ({ ...current, titulo }))}
          maxLength={MAX_LENGTHS.titulo}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor={textoId} className={labelClass}>
              Texto
            </label>
            <span
              className={`font-sans text-xs ${
                values.texto.length >= MAX_LENGTHS.texto ? "font-semibold text-red-700" : "text-brand-slate/60"
              }`}
            >
              {values.texto.length}/{MAX_LENGTHS.texto}
            </span>
          </div>
          <textarea
            id={textoId}
            required
            maxLength={MAX_LENGTHS.texto}
            rows={2}
            value={values.texto}
            onChange={(event) => setValues((current) => ({ ...current, texto: event.target.value }))}
            className={inputClass}
          />
        </div>
        <ContrastWarning ratio={textContrast} label="texto sobre fondo" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CharLimitedField
            id={ctaLabelId}
            label="Etiqueta del botón (opcional)"
            value={values.ctaLabel}
            onChange={(ctaLabel) => setValues((current) => ({ ...current, ctaLabel }))}
            maxLength={MAX_LENGTHS.ctaLabel}
          />
          <div>
            <label htmlFor={ctaUrlId} className={`mb-1.5 block ${labelClass}`}>
              Enlace del botón (opcional)
            </label>
            <input
              id={ctaUrlId}
              type="text"
              placeholder="/categoria/herramientas o https://…"
              value={values.ctaUrl}
              onChange={(event) => setValues((current) => ({ ...current, ctaUrl: event.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <fieldset>
          <legend className={`mb-1.5 ${labelClass}`}>Tipo de fondo</legend>
          <div className="flex gap-4">
            <label className="flex min-h-11 items-center gap-2 font-sans text-sm text-brand-black">
              <input
                type="radio"
                name="tipoFondo"
                checked={values.tipoFondo === "solido"}
                onChange={() => setValues((current) => ({ ...current, tipoFondo: "solido" }))}
                className="size-4 accent-brand-orange"
              />
              Sólido
            </label>
            <label className="flex min-h-11 items-center gap-2 font-sans text-sm text-brand-black">
              <input
                type="radio"
                name="tipoFondo"
                checked={values.tipoFondo === "imagen"}
                onChange={() => setValues((current) => ({ ...current, tipoFondo: "imagen" }))}
                className="size-4 accent-brand-orange"
              />
              Imagen
            </label>
          </div>
        </fieldset>

        {values.tipoFondo === "imagen" ? (
          <>
            <PopupImageUploader
              value={values.imagenUrl}
              onChange={(imagenUrl) => setValues((current) => ({ ...current, imagenUrl }))}
            />
            <div>
              <label htmlFor={textoAltId} className={`mb-1.5 block ${labelClass}`}>
                Texto alternativo de la imagen
              </label>
              <input
                id={textoAltId}
                type="text"
                required
                value={values.textoAlternativo}
                onChange={(event) =>
                  setValues((current) => ({ ...current, textoAlternativo: event.target.value }))
                }
                className={inputClass}
              />
            </div>
          </>
        ) : (
          <ColorField
            id={colorFondoId}
            label="Color de fondo"
            value={values.colorFondo}
            onChange={(colorFondo) => setValues((current) => ({ ...current, colorFondo }))}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ColorField
            id={colorTextoId}
            label="Color de texto"
            value={values.colorTexto}
            onChange={(colorTexto) => setValues((current) => ({ ...current, colorTexto }))}
          />
          <ColorField
            id={colorBotonId}
            label="Color del botón"
            value={values.colorBoton}
            onChange={(colorBoton) => setValues((current) => ({ ...current, colorBoton }))}
          />
          <ColorField
            id={colorTextoBotonId}
            label="Color de texto del botón"
            value={values.colorTextoBoton}
            onChange={(colorTextoBoton) => setValues((current) => ({ ...current, colorTextoBoton }))}
          />
        </div>
        <ContrastWarning ratio={buttonContrast} label="texto del botón" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={startsAtId} className={`mb-1.5 block ${labelClass}`}>
              Inicio (hora de Ciudad de México)
            </label>
            <DateTimePicker
              id={startsAtId}
              label="Inicio (hora de Ciudad de México)"
              value={values.startsAtInput}
              onChange={(startsAtInput) => setValues((current) => ({ ...current, startsAtInput }))}
            />
          </div>
          <div>
            <label htmlFor={endsAtId} className={`mb-1.5 block ${labelClass}`}>
              Fin (hora de Ciudad de México)
            </label>
            <DateTimePicker
              id={endsAtId}
              label="Fin (hora de Ciudad de México)"
              value={values.endsAtInput}
              onChange={(endsAtInput) => setValues((current) => ({ ...current, endsAtInput }))}
            />
          </div>
        </div>

        <label htmlFor={activoId} className="flex min-h-11 items-center gap-2">
          <input
            id={activoId}
            type="checkbox"
            checked={values.activo}
            onChange={(event) => setValues((current) => ({ ...current, activo: event.target.checked }))}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          <span className="font-sans text-sm text-brand-black">
            Activo (se publicará si cae dentro de la ventana de fechas)
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting} className="sm:self-start">
            {isSubmitting ? "Guardando…" : mode === "create" ? "Publicar" : "Guardar cambios"}
          </Button>
          {mode === "edit" && currentlyActive && (
            <button
              type="button"
              onClick={handleRetireNow}
              disabled={isRetiring}
              className="min-h-11 rounded-md border-2 border-red-600 px-4 font-sans text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {isRetiring ? "Retirando…" : "Retirar ahora"}
            </button>
          )}
        </div>
      </form>

      {/* Vista previa: el mismo componente que usa el sitio público
          (PopupBannerCardContent), no interactivo — mismo criterio que
          PromoBannerForm/PromoCard. Escritorio y móvil lado a lado para
          cumplir "en versión escritorio y móvil" sin depender de que el
          admin achique la ventana del navegador.

          min-h en vez de una altura fija: con h-40 (160px) + overflow-hidden
          + items-end, un título de dos líneas empujaba la tarjeta hacia
          arriba y la mitad de arriba (esquina redondeada, primera línea del
          título) quedaba recortada fuera de la caja — bug reportado por el
          cliente. Con solo min-h el contenedor crece con el contenido
          (nunca recorta) y de paso se ve una franja de "piso" que refuerza
          la idea de "esquina de la pantalla", en vez de una caja pegada al
          borde de la tarjeta. */}
      <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:w-[420px] xl:shrink-0">
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Vista previa — escritorio</span>
          <div className="relative flex min-h-60 items-end justify-start rounded-lg border border-brand-slate/10 bg-brand-gray p-4">
            <div className="w-[320px]">
              <PopupBannerCardContent banner={previewData} interactive={false} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Vista previa — móvil (375px)</span>
          <div className="relative mx-auto flex min-h-60 w-[375px] items-end justify-start rounded-lg border border-brand-slate/10 bg-brand-gray p-3">
            <div className="w-[85vw] max-w-[320px]">
              <PopupBannerCardContent banner={previewData} interactive={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
