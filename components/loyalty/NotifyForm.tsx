"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";

// Sin backend todavía (no hay Supabase en esta fase): el envío solo cambia
// un estado local. Cuando exista el servicio real, esta es la única pieza
// que hay que tocar — el resto de la página no depende de esto.
export function NotifyForm() {
  const [submitted, setSubmitted] = useState(false);
  const emailId = useId();

  if (submitted) {
    return (
      <p
        role="status"
        className="rounded-lg bg-brand-gray px-4 py-3 font-sans text-sm text-brand-black sm:text-base"
      >
        ¡Listo! Te avisaremos en cuanto esté disponible.
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <label htmlFor={emailId} className="sr-only">
        Correo electrónico
      </label>
      <input
        id={emailId}
        type="email"
        required
        placeholder="tu@correo.com"
        className="min-h-11 w-full rounded-md border border-brand-slate/30 bg-white px-4 py-2 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate sm:flex-1"
      />
      <Button type="submit" variant="primary" className="shrink-0">
        Avísame cuando esté disponible
      </Button>
    </form>
  );
}
