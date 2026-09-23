import { Resend } from "resend";

// Dominio ferreteria57.com ya verificado en Resend (DKIM + SPF) — única
// referencia al remitente en todo el código, nada más que cambiar si el
// día de mañana se quiere usar otra dirección bajo el mismo dominio.
export const EMAIL_FROM = "pedidos@ferreteria57.com";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export interface SendEmailResult {
  error?: string;
}

// Único punto de envío de correo de toda la app — todo lo que mande un
// correo pasa por aquí, nunca directo por el SDK de Resend.
//
// EMAIL_OVERRIDE ya no debe existir en Vercel (era necesaria solo
// mientras el dominio no estaba verificado, para redirigir TODO correo a
// una sola bandeja de prueba sin que Resend lo rechazara). Se deja el
// mecanismo en el código por si hace falta reactivarlo para pruebas
// puntuales, pero sin la variable seteada `to` llega tal cual a su
// destinatario real.
//
// Nunca lanza — siempre regresa {error?} para que quien llama decida qué
// hacer (hoy, todos los callers solo registran el error en el log sin
// bloquear su propio flujo, ver checkout/actions.ts).
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  const recipient = process.env.EMAIL_OVERRIDE || to;

  try {
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: recipient,
      subject,
      html,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido al enviar el correo." };
  }
}
