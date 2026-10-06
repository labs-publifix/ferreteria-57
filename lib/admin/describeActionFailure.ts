import { createClient } from "@/lib/supabase/client";

export interface ActionFailure {
  message: string;
  /** true = la sesión de administrador ya no es válida: hay que volver a iniciar sesión. */
  sessionLost: boolean;
}

// Una Server Action del admin que "truena" (en vez de devolver { error })
// casi siempre significa que la sesión de administrador ya no es válida:
// el middleware redirige al login y el formulario recibe HTML en lugar de
// la respuesta esperada. Pasa, por ejemplo, si en el mismo navegador se
// inició sesión en /cuenta con una cuenta de cliente (reemplaza la sesión
// en todas las pestañas). Se revisa la sesión real para decir qué pasó en
// vez de un "error inesperado" genérico.
export async function describeActionFailure(error: unknown, accion: string): Promise<ActionFailure> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        sessionLost: true,
        message: `Tu sesión de administrador expiró, por eso no se pudo ${accion}. Inicia sesión de nuevo en otra pestaña y vuelve a intentarlo: lo que capturaste aquí se conserva.`,
      };
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return {
        sessionLost: true,
        message: `En este navegador ahora hay una sesión que no es de administrador (por ejemplo, entraste a "Mi cuenta" con una cuenta de cliente), por eso no se pudo ${accion}. Inicia sesión como administrador en otra pestaña y vuelve a intentarlo: lo que capturaste aquí se conserva.`,
      };
    }
  } catch {
    // Sin conexión para revisar la sesión: cae al mensaje con el detalle.
  }

  const detalle = error instanceof Error && error.message ? ` (detalle: ${error.message.slice(0, 160)})` : "";
  return {
    sessionLost: false,
    message: `No se pudo ${accion} por un error inesperado${detalle}. Revisa tu conexión e intenta de nuevo.`,
  };
}
