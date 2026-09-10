import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca el token de sesión en cada request (patrón oficial de
// @supabase/ssr para Next.js App Router): sin esto, un token expirado no
// se renovaría hasta que el usuario recargara una página que llame a
// getUser() del lado del servidor, dejando la sesión "colgada" mientras
// tanto. supabase.auth.getUser() aquí es lo que dispara el refresh.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // El middleware corre en TODA request del sitio (no solo /cuenta): si
  // todavía no se agregaron las variables de entorno en Vercel, más vale
  // no tocar la sesión que tirar el sitio completo con un 500 por una URL
  // inválida al construir el cliente.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No usar supabase.auth.getSession() aquí: getUser() revalida el token
  // contra el servidor de Supabase en cada request en vez de confiar en el
  // JWT de la cookie sin verificar, que es lo que getSession() haría.
  await supabase.auth.getUser();

  return supabaseResponse;
}
