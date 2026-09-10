"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  // false hasta que se resuelve la sesión inicial (primer round-trip a
  // Supabase) — el Header lo usa para no mostrar el ícono "sin sesión" un
  // instante antes de saber si en realidad sí hay una (mismo criterio que
  // isHydrated en CartProvider).
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Único punto donde el resto de la app (Header, /cuenta) se entera del
// estado de sesión: onAuthStateChange dispara tanto para el login/logout
// que pasa en esta pestaña como para el que Supabase detecta al recargar
// (token en localStorage), así que un solo listener basta para ambos casos
// sin necesitar getUser() por separado al montar.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // AuthProvider envuelve TODO el sitio desde el layout raíz: si todavía
    // no se agregaron las variables de entorno en Vercel, el resto de las
    // páginas (que no dependen de sesión) no tiene por qué dejar de
    // funcionar. Sin configurar, el Header simplemente se queda en su
    // estado "sin sesión" de siempre.
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
