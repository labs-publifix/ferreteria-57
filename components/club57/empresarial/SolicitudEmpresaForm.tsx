"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  solicitarAfiliacionEmpresa,
  type SolicitudEmpresaInput,
  type SolicitudEmpresaResult,
} from "@/app/(site)/club57/empresarial/actions";

type Campo = keyof SolicitudEmpresaInput;

const VACIO: SolicitudEmpresaInput = {
  razon_social: "",
  nombre_comercial: "",
  rfc: "",
  giro: "",
  num_empleados: "",
  regimen_fiscal: "",
  cp_fiscal: "",
  uso_cfdi: "",
  correo_facturas: "",
  domicilio_entrega: "",
  responsable_nombre: "",
  responsable_puesto: "",
  responsable_correo: "",
  responsable_telefono: "",
  acepta: false,
  sitio_web: "",
};

const inputClass =
  "min-h-11 w-full rounded-md border bg-white px-3 py-2.5 font-sans text-base text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:text-sm";

interface FieldDef {
  name: Exclude<Campo, "acepta" | "sitio_web">;
  label: string;
  type?: string;
  inputMode?: "numeric" | "email" | "tel" | "text";
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  wide?: boolean;
  maxLength?: number;
}

const GRUPOS: { titulo: string; descripcion?: string; campos: FieldDef[] }[] = [
  {
    titulo: "Tu empresa",
    campos: [
      { name: "nombre_comercial", label: "Nombre comercial", autoComplete: "organization" },
      { name: "razon_social", label: "Razón social", placeholder: "Como aparece en tu constancia fiscal" },
      { name: "rfc", label: "RFC", maxLength: 16, placeholder: "12 o 13 caracteres" },
      { name: "giro", label: "Giro", placeholder: "p. ej. Construcción, manufactura" },
      { name: "num_empleados", label: "Número aproximado de empleados", inputMode: "numeric" },
    ],
  },
  {
    titulo: "Datos fiscales",
    descripcion: "Para emitir la factura mensual de tu empresa.",
    campos: [
      { name: "regimen_fiscal", label: "Régimen fiscal", placeholder: "p. ej. 601 General de Ley Personas Morales" },
      { name: "uso_cfdi", label: "Uso de CFDI", placeholder: "p. ej. G03 Gastos en general" },
      { name: "cp_fiscal", label: "Código postal fiscal", inputMode: "numeric", maxLength: 5 },
      { name: "correo_facturas", label: "Correo para recibir facturas", type: "email", inputMode: "email" },
    ],
  },
  {
    titulo: "Responsable del programa",
    descripcion: "Normalmente alguien de Recursos Humanos. Será quien administre el programa en tu empresa.",
    campos: [
      { name: "responsable_nombre", label: "Nombre completo", autoComplete: "name" },
      { name: "responsable_puesto", label: "Puesto", autoComplete: "organization-title" },
      { name: "responsable_correo", label: "Correo", type: "email", inputMode: "email", autoComplete: "email" },
      { name: "responsable_telefono", label: "Teléfono", type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "10 dígitos" },
    ],
  },
  {
    titulo: "Entrega",
    campos: [
      {
        name: "domicilio_entrega",
        label: "Domicilio de la empresa",
        optional: true,
        wide: true,
        hint: "Por si tus colaboradores prefieren recibir ahí sus pedidos.",
      },
    ],
  },
];

export function SolicitudEmpresaForm() {
  const baseId = useId();
  const [values, setValues] = useState<SolicitudEmpresaInput>(VACIO);
  const [result, setResult] = useState<SolicitudEmpresaResult | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const errores = result?.errores ?? {};

  function set<K extends Campo>(name: K, value: SolicitudEmpresaInput[K]) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    const response = await solicitarAfiliacionEmpresa(values);
    enviandoRef.current = false;
    setEnviando(false);
    setResult(response);
    if (!response.ok) {
      const primero = Object.keys(response.errores ?? {})[0];
      if (primero) document.getElementById(`${baseId}-${primero}`)?.focus();
    }
  }

  if (result?.ok) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <CheckCircle2 className="size-10 text-green-700" aria-hidden="true" strokeWidth={1.75} />
        <h3 className="font-display text-xl uppercase text-brand-black">Recibimos tu solicitud</h3>
        <p className="max-w-prose font-sans text-sm text-brand-slate sm:text-base">
          Nuestro equipo la revisará y se pondrá en contacto con {values.responsable_nombre.split(" ")[0] || "el responsable"}{" "}
          para acordar las condiciones del convenio. Te enviamos una confirmación a{" "}
          <strong className="text-brand-black">{values.responsable_correo}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-6 rounded-xl bg-white p-5 shadow-sm sm:p-8">
      {result?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          {result.error}
        </p>
      )}

      {GRUPOS.map((grupo) => (
        <fieldset key={grupo.titulo} className="flex flex-col gap-4">
          <legend className="mb-1">
            <span className="font-display text-base uppercase text-brand-slate">{grupo.titulo}</span>
            {grupo.descripcion && (
              <span className="mt-0.5 block font-sans text-sm text-brand-slate/70">{grupo.descripcion}</span>
            )}
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {grupo.campos.map((campo) => {
              const id = `${baseId}-${campo.name}`;
              const error = errores[campo.name];
              const describedBy = [error ? `${id}-error` : "", campo.hint ? `${id}-hint` : ""].filter(Boolean).join(" ");
              return (
                <div key={campo.name} className={campo.wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
                    {campo.label}
                    {campo.optional && <span className="font-normal text-brand-slate/60"> (opcional)</span>}
                  </label>
                  <input
                    id={id}
                    name={campo.name}
                    type={campo.type ?? "text"}
                    inputMode={campo.inputMode}
                    autoComplete={campo.autoComplete}
                    placeholder={campo.placeholder}
                    maxLength={campo.maxLength}
                    required={!campo.optional}
                    value={values[campo.name]}
                    onChange={(event) => set(campo.name, event.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    className={`${inputClass} ${error ? "border-red-600" : "border-brand-slate/30"}`}
                  />
                  {campo.hint && (
                    <p id={`${id}-hint`} className="mt-1 font-sans text-xs text-brand-slate/70">
                      {campo.hint}
                    </p>
                  )}
                  {error && (
                    <p id={`${id}-error`} className="mt-1 font-sans text-xs text-red-700">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Campo trampa para bots: fuera de la vista y del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${baseId}-sitio_web`}>Sitio web</label>
        <input
          id={`${baseId}-sitio_web`}
          tabIndex={-1}
          autoComplete="off"
          value={values.sitio_web}
          onChange={(event) => set("sitio_web", event.target.value)}
        />
      </div>

      <div>
        <label className="flex items-start gap-3 font-sans text-sm text-brand-black">
          <input
            id={`${baseId}-acepta`}
            type="checkbox"
            checked={values.acepta}
            onChange={(event) => set("acepta", event.target.checked)}
            aria-invalid={errores.acepta ? true : undefined}
            aria-describedby={errores.acepta ? `${baseId}-acepta-error` : undefined}
            className="mt-0.5 size-5 shrink-0 rounded border-brand-slate/40 accent-brand-orange"
          />
          <span>
            Autorizo a Ferretería 57 a usar estos datos para revisar la solicitud y contactarme, conforme al{" "}
            <Link href="/aviso-privacidad" className="font-semibold underline underline-offset-2" target="_blank">
              aviso de privacidad
            </Link>
            .
          </span>
        </label>
        {errores.acepta && (
          <p id={`${baseId}-acepta-error`} className="mt-1 pl-8 font-sans text-xs text-red-700">
            {errores.acepta}
          </p>
        )}
      </div>

      <Button type="submit" disabled={enviando} className="w-full sm:w-auto sm:self-start">
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}
