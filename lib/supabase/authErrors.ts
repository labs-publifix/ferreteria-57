// Supabase Auth devuelve sus mensajes de error en inglés — el resto del
// sitio está en español, así que se traducen los casos más comunes que un
// cliente real va a encontrar (credenciales inválidas, correo duplicado,
// contraseña corta, correo sin confirmar). Cualquier otro caso conserva el
// mensaje original de Supabase en vez de esconder el detalle real.
const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "User already registered":
    "Ya existe una cuenta con este correo. Intenta iniciar sesión.",
  "Password should be at least 6 characters":
    "La contraseña debe tener al menos 6 caracteres.",
  "Email not confirmed":
    "Debes confirmar tu correo antes de iniciar sesión — revisa tu bandeja de entrada.",
};

export function translateAuthError(message: string): string {
  return KNOWN_MESSAGES[message] ?? message;
}
