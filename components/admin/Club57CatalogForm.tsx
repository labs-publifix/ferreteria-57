"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import {
  createCatalogItem,
  updateCatalogItem,
  type Club57CatalogActionResult,
} from "@/app/(admin)/admin/(protected)/lealtad/catalogo/actions";

const CATALOG_BUCKET = "club57-catalog-images";

export interface Club57CatalogFormValues {
  nombre: string;
  descripcion: string;
  clave: string;
  costoPuntos: string;
  stock: string;
  imageUrl: string | null;
  active: boolean;
}

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

function emptyValues(): Club57CatalogFormValues {
  return { nombre: "", descripcion: "", clave: "", costoPuntos: "", stock: "0", imageUrl: null, active: false };
}

export function Club57CatalogForm({
  mode,
  itemId,
  initialValues,
}: {
  mode: "create" | "edit";
  itemId?: string;
  initialValues?: Club57CatalogFormValues;
}) {
  const nombreId = useId();
  const descripcionId = useId();
  const claveId = useId();
  const costoPuntosId = useId();
  const stockId = useId();
  const activeId = useId();

  const [values, setValues] = useState<Club57CatalogFormValues>(initialValues ?? emptyValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWithoutImageWarning, setActiveWithoutImageWarning] = useState(false);

  function handleActiveChange(active: boolean) {
    setValues((current) => ({ ...current, active }));
    setActiveWithoutImageWarning(active && !values.imageUrl);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.active && !values.imageUrl) {
      setActiveWithoutImageWarning(true);
      setError("Agrega una imagen para poder activar el artículo.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("nombre", values.nombre);
    formData.set("descripcion", values.descripcion);
    formData.set("clave", values.clave);
    formData.set("costoPuntos", values.costoPuntos);
    formData.set("stock", values.stock);
    formData.set("imageUrl", values.imageUrl ?? "");
    if (values.active) formData.set("active", "on");

    const result: Club57CatalogActionResult =
      mode === "create" ? await createCatalogItem(formData) : await updateCatalogItem(itemId!, formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-10" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-display text-base uppercase text-brand-slate">Datos del artículo</h2>

        <div>
          <label htmlFor={nombreId} className={labelClass}>
            Nombre
          </label>
          <input
            id={nombreId}
            type="text"
            required
            value={values.nombre}
            onChange={(event) => setValues((current) => ({ ...current, nombre: event.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={descripcionId} className={labelClass}>
            Descripción
          </label>
          <textarea
            id={descripcionId}
            rows={3}
            value={values.descripcion}
            onChange={(event) => setValues((current) => ({ ...current, descripcion: event.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={claveId} className={labelClass}>
            Clave (referencia interna, opcional)
          </label>
          <input
            id={claveId}
            type="text"
            value={values.clave}
            onChange={(event) => setValues((current) => ({ ...current, clave: event.target.value }))}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Código interno del artículo — nunca se muestra al cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={costoPuntosId} className={labelClass}>
              Puntos requeridos
            </label>
            <input
              id={costoPuntosId}
              type="number"
              required
              min="1"
              step="1"
              value={values.costoPuntos}
              onChange={(event) => setValues((current) => ({ ...current, costoPuntos: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={stockId} className={labelClass}>
              Stock disponible
            </label>
            <input
              id={stockId}
              type="number"
              required
              min="0"
              step="1"
              value={values.stock}
              onChange={(event) => setValues((current) => ({ ...current, stock: event.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <SingleImageUploader
          bucket={CATALOG_BUCKET}
          value={values.imageUrl}
          onChange={(imageUrl) => {
            setValues((current) => ({ ...current, imageUrl }));
            if (imageUrl) setActiveWithoutImageWarning(false);
          }}
        />
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor={activeId} className="flex min-h-11 items-center gap-2">
          <input
            id={activeId}
            type="checkbox"
            checked={values.active}
            onChange={(event) => handleActiveChange(event.target.checked)}
            className="size-5 rounded border-brand-slate/40 accent-brand-orange"
          />
          <span className="font-sans text-sm text-brand-black">Activo (visible para canje)</span>
        </label>
        {activeWithoutImageWarning && (
          <p className="mt-2 font-sans text-xs text-red-700">
            Necesitas una imagen para poder activar este artículo.
          </p>
        )}
      </section>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Guardando…" : mode === "create" ? "Crear artículo" : "Guardar cambios"}
      </Button>
    </form>
  );
}
