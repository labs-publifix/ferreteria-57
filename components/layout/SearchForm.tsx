"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./header-icons";

// Extraído de Header (antes vivía inline, duplicado entre la versión de
// escritorio y la colapsada de móvil) para poder reusarse tal cual en
// app/not-found.tsx — mismo comportamiento en los tres lugares: un solo
// submit que manda a /buscar?q=..., sin depender de nada del Header (ni
// contexto ni props además de las suyas).
export function SearchForm({
  autoFocus = false,
  className = "",
}: {
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Buscar productos
      </label>
      <input
        id={inputId}
        type="search"
        placeholder="Buscar productos..."
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-md border border-brand-slate/30 bg-brand-white py-2 pl-4 pr-11 font-sans text-sm text-brand-black placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-brand-slate hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      >
        <SearchIcon />
      </button>
    </form>
  );
}
