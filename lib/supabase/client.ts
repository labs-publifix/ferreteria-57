"use client";

import { createBrowserClient } from "@supabase/ssr";

// Un solo cliente de Supabase para todo el navegador (patrón recomendado
// por @supabase/ssr): createBrowserClient ya maneja su propio singleton
// internamente, así que basta con llamarlo donde se necesite sin
// preocuparse por crear más de una instancia.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
