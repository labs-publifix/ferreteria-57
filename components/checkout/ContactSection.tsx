"use client";

import { useId } from "react";

export function ContactSection({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const emailId = useId();

  return (
    <section aria-labelledby="contacto-heading">
      <h2
        id="contacto-heading"
        className="mb-4 font-display text-lg uppercase text-brand-slate"
      >
        Contacto
      </h2>
      <label
        htmlFor={emailId}
        className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
      >
        Correo electrónico
      </label>
      <input
        id={emailId}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="tu@correo.com"
        className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />
    </section>
  );
}
