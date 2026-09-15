"use client";

import { useId, useState } from "react";
import { LoyaltyCta } from "@/components/loyalty/LoyaltyCta";
import { isValidEmail, isValidPhone } from "@/lib/checkout/validation";

export interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const emptyContact: ContactForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

function ContactField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  className = "",
  error,
}: {
  label: string;
  type: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  /** Mensaje a mostrar cuando el campo, ya visitado, no es válido. */
  error?: string;
}) {
  const id = useId();
  const errorId = useId();
  // "Tocado" recién al salir del campo (blur), no en cada tecla — mostrar
  // el error desde la primera letra escrita sería ruidoso y sentiría el
  // formulario regañando antes de que la persona termine de escribir.
  const [touched, setTouched] = useState(false);
  const showError = touched && Boolean(error);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
        {label}
        <span className="text-brand-orange" aria-hidden="true">
          {" "}
          *
        </span>
      </label>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        className={`w-full rounded-md border px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate ${
          showError ? "border-red-500" : "border-brand-slate/30"
        }`}
      />
      {showError && (
        <p id={errorId} className="mt-1 font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// Primer paso del checkout, igual para las 3 modalidades de entrega — el CTA
// de lealtad va antes que cualquier campo (pedido explícito: invitar a
// registrarse sin interrumpir el avance del pedido, nunca como modal).
export function ContactSection({
  contact,
  onContactChange,
}: {
  contact: ContactForm;
  onContactChange: (contact: ContactForm) => void;
}) {
  function updateField(field: keyof ContactForm, value: string) {
    onContactChange({ ...contact, [field]: value });
  }

  return (
    <section aria-labelledby="contacto-heading" className="flex flex-col gap-4">
      <LoyaltyCta />

      <div>
        <h2 id="contacto-heading" className="mb-4 font-display text-lg uppercase text-brand-slate">
          Contacto
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ContactField
            label="Nombre"
            type="text"
            autoComplete="given-name"
            value={contact.firstName}
            onChange={(value) => updateField("firstName", value)}
            error={contact.firstName.trim() === "" ? "Ingresa tu nombre." : undefined}
          />
          <ContactField
            label="Apellido"
            type="text"
            autoComplete="family-name"
            value={contact.lastName}
            onChange={(value) => updateField("lastName", value)}
            error={contact.lastName.trim() === "" ? "Ingresa tu apellido." : undefined}
          />
          <ContactField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={contact.email}
            onChange={(value) => updateField("email", value)}
            error={!isValidEmail(contact.email) ? "Ingresa un correo electrónico válido." : undefined}
          />
          <ContactField
            label="Teléfono móvil"
            type="tel"
            autoComplete="tel"
            placeholder="442 000 0000"
            value={contact.phone}
            onChange={(value) => updateField("phone", value)}
            error={!isValidPhone(contact.phone) ? "Ingresa un teléfono a 10 dígitos." : undefined}
          />
        </div>
      </div>
    </section>
  );
}
