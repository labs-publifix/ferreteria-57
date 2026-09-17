import { Resend } from "resend";

// Remitente mientras el dominio propio no esté verificado en Resend —
// "onboarding@resend.dev" solo puede mandar a la cuenta dueña del API key,
// que es justo lo que EMAIL_OVERRIDE ya fuerza (ver más abajo). El día que
// el dominio esté verificado, cambia SOLO este valor a algo como
// "pedidos@ferreteria57.com" — es la única referencia al remitente en
// todo el código, nada más que cambiar.
export const EMAIL_FROM = "onboarding@resend.dev";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  error?: string;
}

// Único punto de envío de correo de toda la app — todo lo que mande un
// correo pasa por aquí, nunca directo por el SDK de Resend.
//
// EMAIL_OVERRIDE: mientras el dominio de envío no esté verificado, TODO
// correo (sin excepción) se redirige a esa dirección en vez del
// destinatario real — pero el asunto y el cuerpo NO cambian, siguen
// dirigidos a quien de verdad iba dirigido el correo (si es la
// confirmación de "Juan Pérez", el cuerpo sigue diciendo "Juan Pérez"
// aunque llegue físicamente a la bandeja de override). Esto permite
// probar el flujo completo hoy sin que Resend rechace el envío por
// dominio no verificado; el día que se quite la variable, los correos
// empiezan a llegar a sus destinatarios reales sin tocar código.
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
