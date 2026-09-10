"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrors";

type Tab = "login" | "signup";

// Un solo <input> reutilizado por los 3 campos de los 2 formularios: mismo
// estilo que ya usa ContactSection.tsx en checkout, para no inventar un
// segundo lenguaje visual de formularios en el sitio.
function FormField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />
    </div>
  );
}

// Formulario con dos pestañas (patrón WAI-ARIA "Tabs") para no competir por
// espacio en 375px: solo un formulario visible a la vez, en vez de mostrar
// login y registro apilados. Cada pestaña tiene su propio estado y su
// propio submit — comparten estilos (FormField) pero no lógica, para que un
// error en uno no deje campos a medias en el otro.
export function AuthTabs() {
  const [tab, setTab] = useState<Tab>("login");
  const tabListId = useId();

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <div
        role="tablist"
        aria-label="Iniciar sesión o crear cuenta"
        id={tabListId}
        className="flex rounded-lg border border-brand-slate/30 p-1"
      >
        <TabButton active={tab === "login"} onClick={() => setTab("login")}>
          Iniciar sesión
        </TabButton>
        <TabButton active={tab === "signup"} onClick={() => setTab("signup")}>
          Crear cuenta
        </TabButton>
      </div>

      {tab === "login" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-9 flex-1 rounded-md font-sans text-sm font-semibold transition-colors ${
        active
          ? "bg-brand-slate text-white"
          : "text-brand-slate hover:bg-brand-gray"
      }`}
    >
      {children}
    </button>
  );
}

function LoginForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(translateAuthError(signInError.message));
      setIsSubmitting(false);
      return;
    }

    // La sesión ya quedó en las cookies (createBrowserClient las escribe
    // ahí, no en localStorage, justo para esto): refresh() vuelve a pedir
    // los Server Components de la ruta actual, que ahora sí ven sesión.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <FormField
        id={emailId}
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <FormField
        id={passwordId}
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      setIsSubmitting(false);
      return;
    }

    // Con confirmación de correo activada (default de Supabase), signUp
    // crea el usuario pero no regresa sesión hasta que confirme el enlace
    // — no hay nada que refrescar todavía, solo avisar que revise su
    // correo. Si el proyecto tiene la confirmación desactivada, data.session
    // ya viene, y se procede igual que en el login.
    if (data.session) {
      router.refresh();
      return;
    }

    setNeedsConfirmation(true);
    setIsSubmitting(false);
  }

  if (needsConfirmation) {
    return (
      <p
        role="status"
        className="rounded-lg bg-brand-gray px-4 py-3 font-sans text-sm text-brand-black"
      >
        ¡Listo! Te enviamos un correo a <strong>{email}</strong> para
        confirmar tu cuenta — ábrelo para poder iniciar sesión.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <FormField
        id={nameId}
        label="Nombre completo"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={setFullName}
      />
      <FormField
        id={emailId}
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <FormField
        id={passwordId}
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={setPassword}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
