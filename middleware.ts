import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas menos assets estáticos e imágenes: no hay
     * nada que la sesión de Supabase necesite refrescar ahí.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|brand/).*)",
  ],
};
