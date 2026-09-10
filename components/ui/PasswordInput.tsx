"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// Reutilizado por todos los flujos de login/registro de la plataforma
// (AuthTabs de /cuenta, AdminLoginForm, CreateAdminForm) — un solo lugar
// para el mismo comportamiento de mostrar/ocultar en vez de repetir el
// input+botón+estado en cada formulario.
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 pr-11 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" strokeWidth={1.75} />
          ) : (
            <Eye className="size-4" aria-hidden="true" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}
