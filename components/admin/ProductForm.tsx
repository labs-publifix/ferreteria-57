"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { detectBrandFromName } from "@/lib/catalog/detectBrandFromName";
import { slugify } from "@/lib/slugify";
import {
  createProduct,
  updateProduct,
  type ProductActionResult,
} from "@/app/(admin)/admin/(protected)/productos/actions";
import type { TechnicalSpec } from "@/types/catalog";

interface VariantValues {
  id?: string;
  sku: string;
  label: string;
  price: string;
  compareAtPrice: string;
  stock: string;
}

interface ProductFormValues {
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  specSheetUrl: string;
  active: boolean;
  variants: VariantValues[];
  technicalSpecs: TechnicalSpec[];
  images: string[];
}

const EMPTY_VARIANT: VariantValues = {
  sku: "",
  label: "Único",
  price: "",
  compareAtPrice: "",
  stock: "",
};

function emptyValues(defaultCategoryId: string): ProductFormValues {
  return {
    categoryId: defaultCategoryId,
    name: "",
    slug: "",
    brand: "",
    shortDescription: "",
    specSheetUrl: "",
    active: false,
    variants: [{ ...EMPTY_VARIANT }],
    technicalSpecs: [],
    images: [],
  };
}

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

export function ProductForm({
  mode,
  productId,
  categories,
  defaultCategoryId,
  initialValues,
}: {
  mode: "create" | "edit";
  productId?: string;
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
  initialValues?: ProductFormValues;
}) {
  const nameId = useId();
  const slugId = useId();
  const categoryId = useId();
  const brandId = useId();
  const brandListId = useId();
  const shortDescriptionId = useId();
  const specSheetUrlId = useId();
  const activeId = useId();
  // Base para los ids de campos dentro de las filas de variantes/specs
  // (cantidad variable — no se puede usar un useId() fijo por campo como
  // arriba): se combina con el índice de cada fila más abajo.
  const variantsBaseId = useId();
  const specsBaseId = useId();

  const [values, setValues] = useState<ProductFormValues>(
    initialValues ?? emptyValues(defaultCategoryId ?? categories[0]?.id ?? "")
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  // Igual criterio que slugTouched: en edición no se pisa una marca que ya
  // viene guardada; en creación se sugiere sola hasta que el admin la
  // edite a mano, momento en el que deja de recalcularse.
  const [brandTouched, setBrandTouched] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWithoutImageWarning, setActiveWithoutImageWarning] = useState(false);

  function handleNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  }

  // Se dispara al terminar de escribir el Nombre (blur), no en cada tecla:
  // detectBrandFromName necesita el texto completo para encontrar "Truper"
  // o "Pretul" dentro de él, no tiene sentido evaluarlo letra por letra.
  function handleNameBlur() {
    if (brandTouched) return;
    setValues((current) => ({ ...current, brand: detectBrandFromName(current.name) }));
  }

  function updateVariant(index: number, patch: Partial<VariantValues>) {
    setValues((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));
  }

  function addVariant() {
    setValues((current) => ({ ...current, variants: [...current.variants, { ...EMPTY_VARIANT, label: "" }] }));
  }

  function removeVariant(index: number) {
    setValues((current) => ({
      ...current,
      variants: current.variants.filter((_, i) => i !== index),
    }));
  }

  function updateSpec(index: number, patch: Partial<TechnicalSpec>) {
    setValues((current) => ({
      ...current,
      technicalSpecs: current.technicalSpecs.map((spec, i) => (i === index ? { ...spec, ...patch } : spec)),
    }));
  }

  function addSpec() {
    setValues((current) => ({
      ...current,
      technicalSpecs: [...current.technicalSpecs, { label: "", value: "" }],
    }));
  }

  function removeSpec(index: number) {
    setValues((current) => ({
      ...current,
      technicalSpecs: current.technicalSpecs.filter((_, i) => i !== index),
    }));
  }

  function handleActiveChange(active: boolean) {
    setValues((current) => ({ ...current, active }));
    setActiveWithoutImageWarning(active && values.images.length === 0);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.active && values.images.length === 0) {
      setActiveWithoutImageWarning(true);
      setError("Agrega al menos una imagen para poder activar el producto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("categoryId", values.categoryId);
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("brand", values.brand);
    formData.set("shortDescription", values.shortDescription);
    formData.set("specSheetUrl", values.specSheetUrl);
    if (values.active) formData.set("active", "on");
    formData.set("variants", JSON.stringify(values.variants));
    formData.set(
      "technicalSpecs",
      JSON.stringify(values.technicalSpecs.filter((spec) => spec.label.trim() && spec.value.trim()))
    );
    formData.set("images", JSON.stringify(values.images));

    const result: ProductActionResult =
      mode === "create" ? await createProduct(formData) : await updateProduct(productId!, formData);

    // En éxito, la Server Action redirige a /admin/productos — solo se
    // llega aquí de vuelta si hubo un error.
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
        <h2 className="font-display text-base uppercase text-brand-slate">Datos generales</h2>

        <div>
          <label htmlFor={categoryId} className={labelClass}>
            Categoría
          </label>
          <select
            id={categoryId}
            required
            value={values.categoryId}
            onChange={(event) => setValues((current) => ({ ...current, categoryId: event.target.value }))}
            className={inputClass}
          >
            <option value="" disabled>
              Elige una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={nameId} className={labelClass}>
              Nombre
            </label>
            <input
              id={nameId}
              type="text"
              required
              value={values.name}
              onChange={(event) => handleNameChange(event.target.value)}
              onBlur={handleNameBlur}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={brandId} className={labelClass}>
              Marca
            </label>
            <input
              id={brandId}
              type="text"
              required
              list={brandListId}
              value={values.brand}
              onChange={(event) => {
                setBrandTouched(true);
                setValues((current) => ({ ...current, brand: event.target.value }));
              }}
              className={inputClass}
            />
            <datalist id={brandListId}>
              <option value="Truper" />
              <option value="Pretul" />
              <option value="Expert" />
            </datalist>
            <p className="mt-1 font-sans text-xs text-brand-slate/70">
              Se sugiere sola a partir del nombre — edítala si hace falta.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor={slugId} className={labelClass}>
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
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Se autogenera del nombre — edítalo si lo necesitas.
          </p>
        </div>

        <div>
          <label htmlFor={shortDescriptionId} className={labelClass}>
            Descripción corta
          </label>
          <textarea
            id={shortDescriptionId}
            rows={3}
            value={values.shortDescription}
            onChange={(event) =>
              setValues((current) => ({ ...current, shortDescription: event.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={specSheetUrlId} className={labelClass}>
            URL a ficha técnica de Truper
          </label>
          <input
            id={specSheetUrlId}
            type="url"
            placeholder="https://www.truper.com/…"
            value={values.specSheetUrl}
            onChange={(event) => setValues((current) => ({ ...current, specSheetUrl: event.target.value }))}
            className={inputClass}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base uppercase text-brand-slate">Presentaciones</h2>
        </div>

        {values.variants.map((variant, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-md border border-brand-slate/15 p-3 sm:p-4"
          >
            {values.variants.length > 1 && (
              <div className="flex items-center justify-between">
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  Presentación {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  aria-label={`Quitar presentación ${index + 1}`}
                  className="flex size-8 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <div
              className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                values.variants.length > 1 ? "lg:grid-cols-5" : "lg:grid-cols-4"
              }`}
            >
              <div>
                <label htmlFor={`${variantsBaseId}-${index}-sku`} className={labelClass}>
                  Código (SKU)
                </label>
                <input
                  id={`${variantsBaseId}-${index}-sku`}
                  type="text"
                  required
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                  className={inputClass}
                />
              </div>
              {values.variants.length > 1 && (
                <div>
                  <label htmlFor={`${variantsBaseId}-${index}-label`} className={labelClass}>
                    Presentación
                  </label>
                  <input
                    id={`${variantsBaseId}-${index}-label`}
                    type="text"
                    required
                    placeholder='p. ej. "1 batería 2Ah"'
                    value={variant.label}
                    onChange={(event) => updateVariant(index, { label: event.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label htmlFor={`${variantsBaseId}-${index}-price`} className={labelClass}>
                  Precio (MXN)
                </label>
                <input
                  id={`${variantsBaseId}-${index}-price`}
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(event) => updateVariant(index, { price: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${variantsBaseId}-${index}-compareAtPrice`} className={labelClass}>
                  Precio anterior
                </label>
                <input
                  id={`${variantsBaseId}-${index}-compareAtPrice`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.compareAtPrice}
                  onChange={(event) => updateVariant(index, { compareAtPrice: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${variantsBaseId}-${index}-stock`} className={labelClass}>
                  Stock
                </label>
                <input
                  id={`${variantsBaseId}-${index}-stock`}
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={variant.stock}
                  onChange={(event) => updateVariant(index, { stock: event.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={addVariant}
          className="w-full sm:w-auto sm:self-start"
        >
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Agregar otra presentación
        </Button>
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <ProductImageUploader
          images={values.images}
          onChange={(images) => {
            setValues((current) => ({ ...current, images }));
            if (images.length > 0) setActiveWithoutImageWarning(false);
          }}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base uppercase text-brand-slate">
            Especificaciones técnicas
          </h2>
        </div>

        {values.technicalSpecs.map((spec, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`${specsBaseId}-${index}-label`} className={labelClass}>
                Etiqueta
              </label>
              <input
                id={`${specsBaseId}-${index}-label`}
                type="text"
                value={spec.label}
                onChange={(event) => updateSpec(index, { label: event.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label htmlFor={`${specsBaseId}-${index}-value`} className={labelClass}>
                Valor
              </label>
              <input
                id={`${specsBaseId}-${index}-value`}
                type="text"
                value={spec.value}
                onChange={(event) => updateSpec(index, { value: event.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeSpec(index)}
              aria-label={`Quitar especificación ${index + 1}`}
              className="mb-0.5 flex size-11 shrink-0 items-center justify-center rounded-md text-red-700 hover:bg-red-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={addSpec}
          className="w-full sm:w-auto sm:self-start"
        >
          <Plus className="size-4" aria-hidden="true" strokeWidth={2} />
          Agregar especificación
        </Button>
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
          <span className="font-sans text-sm text-brand-black">
            Activo (visible en la tienda)
          </span>
        </label>
        {activeWithoutImageWarning && (
          <p className="mt-2 font-sans text-xs text-red-700">
            Necesitas al menos una imagen para poder activar este producto.
          </p>
        )}
      </section>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Guardando…" : mode === "create" ? "Crear producto" : "Guardar cambios"}
      </Button>
    </form>
  );
}
