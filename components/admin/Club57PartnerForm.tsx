"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Select } from "@/components/ui";
import { PartnerLogoPicker, type LogoChange } from "@/components/admin/PartnerLogoPicker";
import { removePartnerLogo, savePartner, type PartnerFormInput } from "@/app/(admin)/admin/(protected)/lealtad/socios/actions";
import { normalizarCorreo, normalizarCp, normalizarTelefono } from "@/lib/club57/socios/normalize";

export interface PartnerFormValues {
  nombre_comercial: string;
  giro_id: string;
  contacto: string;
  telefono: string;
  correo: string;
  correo_2: string;
  calle: string;
  num_ext: string;
  num_int: string;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
  notas: string;
  consentimiento: boolean;
}

export const EMPTY_PARTNER: PartnerFormValues = {
  nombre_comercial: "",
  giro_id: "",
  contacto: "",
  telefono: "",
  correo: "",
  correo_2: "",
  calle: "",
  num_ext: "",
  num_int: "",
  colonia: "",
  cp: "",
  municipio: "Querétaro",
  estado: "Querétaro",
  notas: "",
  consentimiento: false,
};

const MUNICIPIOS = ["Querétaro", "Corregidora", "El Marqués", "Huimilpan", "Pedro Escobedo", "San Juan del Río", "Colón", "Tequisquiapan"];

const inputClass =
  "min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-3 py-2.5 font-sans text-sm text-brand-black aria-[invalid=true]:border-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

type FieldKey = keyof PartnerFormValues;

// Validación inmediata (al salir del campo) de lo que tiene formato; el
// servidor vuelve a normalizar y validar todo al guardar.
function validarCampo(key: FieldKey, value: string): string | null {
  if (key === "nombre_comercial") return value.trim().length >= 2 ? null : "Escribe el nombre comercial (mínimo 2 caracteres).";
  if (key === "telefono") return normalizarTelefono(value).error ?? null;
  if (key === "correo" || key === "correo_2") return normalizarCorreo(value).error ?? null;
  if (key === "cp") return normalizarCp(value).error ?? null;
  return null;
}

// Alta y edición de un socio comercial (admin y operador).
export function Club57PartnerForm({
  id,
  initial,
  giros,
  logoUrl,
  consentimientoFecha,
}: {
  id?: string;
  initial: PartnerFormValues;
  giros: { id: string; nombre: string; activo: boolean }[];
  logoUrl: string | null;
  consentimientoFecha: string | null;
}) {
  const router = useRouter();
  const formId = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(initial);
  const [giroNuevo, setGiroNuevo] = useState("");
  const [usarGiroNuevo, setUsarGiroNuevo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<LogoChange>({ file: null, remove: false });
  const submittingRef = useRef(false);

  const ids = Object.fromEntries(Object.keys(EMPTY_PARTNER).map((key) => [key, `${formId}-${key}`])) as Record<FieldKey, string>;

  function set<K extends FieldKey>(key: K, value: PartnerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function onBlur(key: FieldKey) {
    const error = validarCampo(key, String(values[key] ?? ""));
    setFieldErrors((current) => ({ ...current, [key]: error ?? undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const locales: Partial<Record<FieldKey, string>> = {};
    for (const key of ["nombre_comercial", "telefono", "correo", "correo_2", "cp"] as FieldKey[]) {
      const error = validarCampo(key, String(values[key] ?? ""));
      if (error) locales[key] = error;
    }
    if (usarGiroNuevo && giroNuevo.trim().length < 2) locales.giro_id = "Escribe el giro nuevo o elige uno de la lista.";
    setFieldErrors(locales);
    const lista = Object.values(locales).filter(Boolean) as string[];
    if (lista.length > 0) {
      setErrors(lista);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    const input: PartnerFormInput = {
      id,
      nombre_comercial: values.nombre_comercial,
      giro_id: usarGiroNuevo ? "" : values.giro_id,
      giro_nuevo: usarGiroNuevo ? giroNuevo : "",
      contacto: values.contacto,
      telefono: values.telefono,
      correo: values.correo,
      correo_2: values.correo_2,
      calle: values.calle,
      num_ext: values.num_ext,
      num_int: values.num_int,
      colonia: values.colonia,
      cp: values.cp,
      municipio: values.municipio,
      estado: values.estado,
      notas: values.notas,
      consentimiento: values.consentimiento,
    };
    const result = await savePartner(input);
    if (result.error || !result.id) {
      submittingRef.current = false;
      setSaving(false);
      setErrors(result.errors?.length ? result.errors : [result.error ?? "No se pudo guardar."]);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    let logoError: string | null = null;
    if (logo.file) {
      const form = new FormData();
      form.append("logo", logo.file, logo.file.type === "image/svg+xml" ? "logo.svg" : "logo.webp");
      const response = await fetch(`/api/admin/lealtad/socios/${result.id}/logo`, { method: "POST", body: form });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        logoError = body.error ?? "No se pudo subir el logotipo.";
      }
    } else if (logo.remove) {
      const removed = await removePartnerLogo(result.id);
      if (removed.error) logoError = removed.error;
    }

    const params = new URLSearchParams({ guardado: id ? "1" : "nuevo" });
    if (logoError) params.set("logo_error", logoError);
    if (result.warnings?.length) params.set("avisos", String(result.warnings.length));
    router.push(`/admin/lealtad/socios/${result.id}?${params.toString()}`);
    router.refresh();
    submittingRef.current = false;
    setSaving(false);
  }

  const giroOptions = [
    { value: "", label: "Por definir (no se publica)" },
    ...giros.filter((g) => g.activo || g.id === initial.giro_id).map((g) => ({ value: g.id, label: g.activo ? g.nombre : `${g.nombre} (inactivo)` })),
  ];

  const field = (key: FieldKey, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={ids[key]} className={labelClass}>
        {label}
      </label>
      <input
        id={ids[key]}
        value={String(values[key] ?? "")}
        onChange={(event) => set(key, event.target.value as never)}
        onBlur={() => onBlur(key)}
        aria-invalid={fieldErrors[key] ? true : undefined}
        aria-describedby={fieldErrors[key] ? `${ids[key]}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {fieldErrors[key] && (
        <p id={`${ids[key]}-error`} className="mt-1 font-sans text-xs text-red-700">
          {fieldErrors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {errors.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={`${formId}-errores`}
          className="rounded-lg border border-red-200 bg-red-50 p-4 font-sans text-sm text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          <p id={`${formId}-errores`} className="font-semibold">
            Revisa estos datos antes de guardar:
          </p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <ul className="rounded-lg bg-amber-50 p-4 font-sans text-sm text-amber-900">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Negocio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {field("nombre_comercial", "Nombre comercial (obligatorio)", { required: true, maxLength: 120, autoComplete: "organization" })}
          </div>
          <div className="sm:col-span-2">
            <span className={labelClass}>Giro</span>
            {usarGiroNuevo ? (
              <input
                aria-label="Giro nuevo"
                value={giroNuevo}
                maxLength={80}
                onChange={(event) => setGiroNuevo(event.target.value)}
                placeholder="Ej. Plomería"
                aria-invalid={fieldErrors.giro_id ? true : undefined}
                className={inputClass}
              />
            ) : (
              <Select label="Giro" value={values.giro_id} onChange={(value) => set("giro_id", value)} options={giroOptions} />
            )}
            <button
              type="button"
              onClick={() => setUsarGiroNuevo((current) => !current)}
              className="mt-1 min-h-11 font-sans text-sm font-medium text-brand-slate underline underline-offset-2"
            >
              {usarGiroNuevo ? "Elegir un giro de la lista" : "Agregar un giro nuevo"}
            </button>
            {fieldErrors.giro_id && <p className="font-sans text-xs text-red-700">{fieldErrors.giro_id}</p>}
            {!usarGiroNuevo && !values.giro_id && (
              <p className="mt-1 font-sans text-xs text-amber-900">
                Sin giro, el socio queda pendiente de completar y no se publica.
              </p>
            )}
          </div>
        </div>
        <PartnerLogoPicker nombre={values.nombre_comercial} currentUrl={logoUrl} onChange={setLogo} />
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Contacto</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("contacto", "Persona de contacto", { maxLength: 120, autoComplete: "name" })}</div>
          {field("telefono", "Teléfono (10 dígitos)", { inputMode: "tel", autoComplete: "tel-national", maxLength: 20 })}
          {field("correo", "Correo", { type: "email", inputMode: "email", autoComplete: "email", maxLength: 160 })}
          {field("correo_2", "Segundo correo (opcional)", { type: "email", inputMode: "email", maxLength: 160 })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Dirección</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">{field("calle", "Calle", { maxLength: 160, autoComplete: "address-line1" })}</div>
          {field("num_ext", "Núm. exterior", { maxLength: 20 })}
          {field("num_int", "Núm. interior", { maxLength: 20 })}
          <div className="col-span-2">{field("colonia", "Colonia", { maxLength: 120 })}</div>
          {field("cp", "CP", { inputMode: "numeric", maxLength: 5, autoComplete: "postal-code" })}
          <div className="col-span-2 sm:col-span-1">
            {field("municipio", "Municipio", { list: `${formId}-municipios`, maxLength: 80 })}
            <datalist id={`${formId}-municipios`}>
              {MUNICIPIOS.map((municipio) => (
                <option key={municipio} value={municipio} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2">{field("estado", "Estado", { maxLength: 60 })}</div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Privacidad y notas</h2>
        <label className="flex cursor-pointer items-start gap-3 font-sans text-sm text-brand-black">
          <input
            type="checkbox"
            checked={values.consentimiento}
            onChange={(event) => set("consentimiento", event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-brand-slate"
          />
          <span>
            El socio autorizó compartir sus datos de contacto con los miembros de Club 57.
            <span className="mt-0.5 block text-xs text-brand-slate/80">
              Requisito de la Ley Federal de Protección de Datos Personales: sin esta autorización los miembros ven al
              socio, pero no su teléfono, correo ni dirección.
              {consentimientoFecha && values.consentimiento && (
                <> Registrado el {new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" }).format(new Date(consentimientoFecha))}.</>
              )}
            </span>
          </span>
        </label>
        <div>
          <label htmlFor={ids.notas} className={labelClass}>
            Notas internas
          </label>
          <textarea
            id={ids.notas}
            rows={3}
            maxLength={1000}
            value={values.notas}
            onChange={(event) => set("notas", event.target.value)}
            className={`${inputClass} min-h-24`}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/80">Solo las ve el personal. Nunca se muestran en el sitio.</p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/admin/lealtad/socios" className={buttonClassName("secondary")}>
          Cancelar
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : id ? "Guardar cambios" : "Dar de alta"}
        </Button>
      </div>
    </form>
  );
}
