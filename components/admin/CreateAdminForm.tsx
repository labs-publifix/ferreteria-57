"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PasswordInput, Select } from "@/components/ui";
import { createAdminUser } from "@/app/(admin)/admin/(protected)/accesos/actions";

type StaffRole = "admin" | "vendedor";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "admin", label: "Administrador — acceso completo al panel" },
  { value: "vendedor", label: "Vendedor — solo sus propios clientes de Club 57" },
];

export function CreateAdminForm() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", role);

    const result = await createAdminUser(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setIsSubmitting(false);
    // Refresca la lista de administradores de la página (Server
    // Component) sin perder el estado de éxito de este formulario.
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6"
      noValidate
    >
      <h2 className="font-display text-base uppercase text-brand-slate">
        Crear cuenta de acceso
      </h2>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-md bg-brand-gray px-4 py-2.5 font-sans text-sm text-brand-black"
        >
          Cuenta creada — ya puede iniciar sesión en /admin/login.
        </p>
      )}

      <div>
        <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Rol</span>
        <Select value={role} onChange={(value) => setRole(value as StaffRole)} options={ROLE_OPTIONS} label="Rol" />
      </div>

      <div>
        <label
          htmlFor={nameId}
          className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
        >
          Nombre completo
        </label>
        <input
          id={nameId}
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
      </div>

      <div>
        <label
          htmlFor={emailId}
          className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
        >
          Correo electrónico
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black placeholder:text-brand-slate/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
      </div>

      <PasswordInput
        id={passwordId}
        label="Contraseña"
        autoComplete="new-password"
        minLength={6}
        value={password}
        onChange={setPassword}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Creando…" : role === "admin" ? "Crear administrador" : "Crear vendedor"}
      </Button>
    </form>
  );
}
