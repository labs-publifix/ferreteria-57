"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { IconPicker } from "@/components/admin/IconPicker";
import { slugify } from "@/lib/slugify";
import {
  createCategory,
  updateCategory,
  type CategoryActionResult,
} from "@/app/(admin)/admin/(protected)/categorias/actions";

interface CategoryFormValues {
  name: string;
  slug: string;
  icon: string;
  position: number;
  active: boolean;
}

const EMPTY_VALUES: CategoryFormValues = {
  name: "",
  slug: "",
  icon: "Wrench",
  position: 0,
  active: true,
};

// Un solo formulario para crear y editar: la única diferencia real es a
// qué Server Action llama y con qué valores arranca (ver las dos páginas
// que lo usan, nueva/page.tsx y [id]/editar/page.tsx).
export function CategoryForm({
  mode,
  categoryId,
  initialValues,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initialValues?: CategoryFormValues;
}) {
  const nameId = useId();
  const slugId = useId();
  const positionId = useId();
  const activeId = useId();

  const [values, setValues] = useState<CategoryFormValues>(initialValues ?? EMPTY_VALUES);
  // Una vez que el admin toca el slug a mano, dejar de regenerarlo solo:
  // si no, cualquier corrección al nombre le borraría el ajuste manual.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("icon", values.icon);
    formData.set("position", String(values.position));
    if (values.active) formData.set("active", "on");

    const result: CategoryActionResult =
      mode === "create"
        ? await createCategory(formData)
        : await updateCategory(categoryId!, formData);

    // En éxito, la Server Action redirige a /admin/categorias — solo se
    // llega aquí de vuelta si hubo un error.
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:max-w-xl sm:p-6"
      noValidate
    >
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor={nameId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
          Nombre
        </label>
        <input
          id={nameId}
          type="text"
          required
          value={values.name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
      </div>

      <div>
        <label htmlFor={slugId} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
          Slug
        </label>
        <input
          id={slugId}
          type="text"
          required
          value={values.slug}
          onChange={(event) => {
            setSlugTouched(true);
            setValues((current) => ({ ...current, slug: event.target.value }));
          }}
          className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
        <p className="mt-1 font-sans text-xs text-brand-slate/70">
          Se autogenera del nombre — edítalo si lo necesitas.
        </p>
      </div>

      <div>
        <p className="mb-1.5 font-sans text-sm font-medium text-brand-black">Ícono</p>
        <IconPicker
          name="icon"
          value={values.icon}
          onChange={(icon) => setValues((current) => ({ ...current, icon }))}
        />
      </div>

      <div>
        <label
          htmlFor={positionId}
          className="mb-1.5 block font-sans text-sm font-medium text-brand-black"
        >
          Posición
        </label>
        <input
          id={positionId}
          type="number"
          value={values.position}
          onChange={(event) =>
            setValues((current) => ({ ...current, position: Number(event.target.value) }))
          }
          className="w-32 rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        />
        <p className="mt-1 font-sans text-xs text-brand-slate/70">
          Un número más chico aparece primero en el menú y el grid del Home.
        </p>
      </div>

      <label htmlFor={activeId} className="flex min-h-11 items-center gap-2">
        <input
          id={activeId}
          type="checkbox"
          checked={values.active}
          onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))}
          className="size-5 rounded border-brand-slate/40 accent-brand-orange"
        />
        <span className="font-sans text-sm text-brand-black">Activa (visible en la tienda)</span>
      </label>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting
          ? "Guardando…"
          : mode === "create"
            ? "Crear categoría"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
