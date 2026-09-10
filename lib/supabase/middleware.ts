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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // CRÍTICO: protección real de servidor para /admin, no solo esconder
  // enlaces en la interfaz — cualquier request a una ruta bajo /admin
  // (salvo la propia página de login) sin sesión O sin is_admin() se
  // redirige antes de que el Server Component correspondiente llegue a
  // ejecutarse. is_admin() (ver supabase/migrations) es la misma función
  // que se reutilizará en las políticas de RLS de las tablas del admin,
  // así que el rol nunca se decide dos veces con dos criterios distintos.
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isAdminLoginRoute) {
    // Cualquier error de red/RPC (incluida la función is_admin() todavía
    // sin crear si la migración no se ha corrido) se trata como "no es
    // admin" — fail-closed: ante la duda, se niega el acceso en vez de
    // dejarlo pasar.
    let isAdmin = false;
    if (user) {
      try {
        const { data, error } = await supabase.rpc("is_admin");
        isAdmin = !error && data === true;
      } catch {
        isAdmin = false;
      }
    }

    if (!isAdmin) {
      const redirectUrl = new URL("/admin/login", request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      // Conserva cualquier cookie de sesión refrescada por getUser() de
      // arriba aunque la respuesta final sea una redirección.
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
