"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export type MembershipState = "loading" | "visitante" | "miembro" | "sin-membresia";

// ¿La sesión actual es miembro de Club 57? (fila propia en club57_members;
// el RLS deja a cada usuario leer solo la suya). Una consulta por usuario
// y por página, compartida entre los CTA del artículo (lateral, en el
// texto y final). Sin sesión no consulta nada.
const cache = new Map<string, Promise<boolean>>();

function isMember(userId: string): Promise<boolean> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = Promise.resolve(
      createClient().from("club57_members").select("id").eq("id", userId).maybeSingle()
    ).then(({ data, error }) => {
      // Error de red: se muestra la versión de miembro (la descarga la
      // valida el servidor, que responde 403 con su mensaje si no lo es) y
      // se reintenta en el siguiente montaje.
      if (error) {
        cache.delete(userId);
        return true;
      }
      return data !== null;
    });
    cache.set(userId, pending);
  }
  return pending;
}

export function useClub57Membership(): MembershipState {
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<MembershipState>("loading");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setState("visitante");
      return;
    }
    let active = true;
    isMember(user.id).then((member) => {
      if (active) setState(member ? "miembro" : "sin-membresia");
    });
    return () => {
      active = false;
    };
  }, [user, isLoading]);

  return state;
}
