"use client";

import { useId, useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { detectBrandFromName, KNOWN_BRANDS } from "@/lib/catalog/detectBrandFromName";
import { slugify } from "@/lib/slugify";
import { formatPrice } from "@/lib/formatPrice";
import {
  fillLevels,
  isDescending,
  parseMoney,
  PRICE_LISTS,
  priceForList,
  type PriceList,
} from "@/lib/catalog/priceLevels";
import {
  createProduct,
  updateProduct,
  type ProductActionResult,
} from "@/app/(admin)/admin/(protected)/productos/actions";
import type { TechnicalSpec } from "@/types/catalog";

export interface VariantValues {
  id?: string;
  sku: string;
  label: string;
  /** Precio 1 a Precio 4; vacío = se usará el Precio 1. */
  prices: [string, string, string, string];
  compareAtPrice: string;
  stock: string;
}

export interface ProductFormValues {
  categoryId: string;
  name: string;
  slug: string;
  brand: string;
  clave: string;
  shortDescription: string;
  specSheetUrl: string;
  active: boolean;
  variants: VariantValues[];
  technicalSpecs: TechnicalSpec[];
  images: string[];
}

export const EMPTY_VARIANT: VariantValues = {
  sku: "",
  label: "Único",
  prices: ["", "", "", ""],
  compareAtPrice: "",
  stock: "",
};

function emptyValues(defaultCategoryId: string): ProductFormValues {
  return {
    categoryId: defaultCategoryId,
    name: "",
    slug: "",
    brand: "",
    clave: "",
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
  storeList,
}: {
  mode: "create" | "edit";
  productId?: string;
  categories: { id: string; name: string }[];
  defaultCategoryId?: string;
  initialValues?: ProductFormValues;
  /** Lista que hoy es el precio de tienda (Configuración → Precios). */
  storeList: PriceList;
}) {
  const nameId = useId();
  const slugId = useId();
  const categoryId = useId();
  const brandId = useId();
  const brandListId = useId();
  const claveId = useId();
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

  function updateVariantPrice(index: number, list: PriceList, value: string) {
    setValues((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => {
        if (i !== index) return variant;
        const prices = [...variant.prices] as VariantValues["prices"];
        prices[list - 1] = value;
        return { ...variant, prices };
      }),
    }));
  }

  function copyFirstPrice(index: number) {
    setValues((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index
          ? { ...variant, prices: [variant.prices[0], variant.prices[0], variant.prices[0], variant.prices[0]] }
          : variant
      ),
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
    formData.set("clave", values.clave);
    formData.set("shortDescription", values.shortDescription);
    formData.set("specSheetUrl", values.specSheetUrl);
    if (values.active) formData.set("active", "on");
    formData.set("variants", JSON.stringify(values.variants));
    formData.set(
      "technicalSpecs",
      JSON.stringify(values.technicalSpecs.filter((spec) => spec.label.trim() && spec.value.trim()))
    );
    formData.set("images", JSON.stringify(values.images));

    // En éxito la acción redirige y no devuelve nada (undefined).
    const result: ProductActionResult | undefined =
      mode === "create" ? await createProduct(formData) : await updateProduct(productId!, formData);

    // En éxito, la Server Action redirige a /admin/productos — solo se
    // llega aquí de vuelta si hubo un error.
    if (result?.error) {
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
              {KNOWN_BRANDS.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
            <p className="mt-1 font-sans text-xs text-brand-slate/70">
              Se sugiere sola a partir del nombre — edítala si hace falta.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor={claveId} className={labelClass}>
            Clave
          </label>
          <input
            id={claveId}
            type="text"
            placeholder='p. ej. "MSK-1-1/2"'
            value={values.clave}
            onChange={(event) => setValues((current) => ({ ...current, clave: event.target.value }))}
            className={inputClass}
          />
          <p className="mt-1 font-sans text-xs text-brand-slate/70">
            Código interno corto del cliente — opcional, distinto del Código (SKU) de cada presentación.
          </p>
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
                values.variants.length > 1 ? "lg:grid-cols-3" : "lg:grid-cols-2"
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

            <VariantPrices
              baseId={`${variantsBaseId}-${index}`}
              variant={variant}
              storeList={storeList}
              onPriceChange={(list, value) => updateVariantPrice(index, list, value)}
              onCopyFirst={() => copyFirstPrice(index)}
              onCompareAtChange={(value) => updateVariant(index, { compareAtPrice: value })}
            />
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


// Las 4 listas de una presentación. Solo el Precio 1 es obligatorio: las
// vacías toman el Precio 1 al guardar. La lista de tienda se marca para que
// quede claro cuál ve el público, y el «precio antes» (oferta) se compara
// solo contra ella.
function VariantPrices({
  baseId,
  variant,
  storeList,
  onPriceChange,
  onCopyFirst,
  onCompareAtChange,
}: {
  baseId: string;
  variant: VariantValues;
  storeList: PriceList;
  onPriceChange: (list: PriceList, value: string) => void;
  onCopyFirst: () => void;
  onCompareAtChange: (value: string) => void;
}) {
  const parsed = variant.prices.map((value) => parseMoney(value));
  const levels = fillLevels(parsed);
  const storePrice = levels ? priceForList(levels, storeList) : null;
  const outOfOrder = levels !== null && !isDescending(levels);
  const compareAt = parseMoney(variant.compareAtPrice);
  const compareAtHidden = compareAt !== null && storePrice !== null && compareAt <= storePrice;
  const legendId = `${baseId}-prices-legend`;

  return (
    <fieldset aria-labelledby={legendId} className="flex flex-col gap-3 rounded-md bg-brand-slate/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={legendId} className="font-sans text-sm font-semibold text-brand-black">
          Precios (MXN)
        </p>
        <button
          type="button"
          onClick={onCopyFirst}
          disabled={!variant.prices[0].trim()}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-brand-slate/30 bg-white px-3 font-sans text-xs font-medium text-brand-black hover:border-brand-slate disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
        >
          <Copy className="size-3.5" aria-hidden="true" />
          Copiar a los demás
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PRICE_LISTS.map((list) => {
          const id = `${baseId}-precio-${list}`;
          const hintId = `${id}-hint`;
          const value = variant.prices[list - 1];
          const isStore = list === storeList;
          const usesFirst = list !== 1 && !value.trim();
          return (
            <div key={list} className="min-w-0">
              <label htmlFor={id} className="mb-1.5 flex h-5 items-center gap-1.5 whitespace-nowrap font-sans text-sm font-medium text-brand-black">
                Precio {list}
                {list === 1 && <span className="text-red-700" aria-hidden="true">*</span>}
                {isStore && (
                  <span title="Esta lista es la que ve el público en la tienda" className="rounded-full bg-brand-orange/15 px-2 text-[11px] font-semibold uppercase leading-5 tracking-wide text-brand-black">
                    Tienda
                  </span>
                )}
              </label>
              <input
                id={id}
                type="number"
                inputMode="decimal"
                required={list === 1}
                min="0"
                step="0.01"
                value={value}
                placeholder={list === 1 ? "" : variant.prices[0]}
                aria-describedby={usesFirst ? hintId : undefined}
                onChange={(event) => onPriceChange(list, event.target.value)}
                className={inputClass}
              />
              {usesFirst && (
                <p id={hintId} className="mt-1 font-sans text-xs text-brand-slate/70">
                  Se usará el Precio 1
                </p>
              )}
            </div>
          );
        })}
      </div>

      {outOfOrder && (
        <p className="font-sans text-xs text-amber-800">
          Revisa el orden: normalmente Precio 1 ≥ Precio 2 ≥ Precio 3 ≥ Precio 4. Se puede guardar así.
        </p>
      )}

      <div className="sm:max-w-xs">
        <label htmlFor={`${baseId}-compareAtPrice`} className={labelClass}>
          Precio antes (oferta)
        </label>
        <input
          id={`${baseId}-compareAtPrice`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={variant.compareAtPrice}
          aria-describedby={`${baseId}-compareAtPrice-hint`}
          onChange={(event) => onCompareAtChange(event.target.value)}
          className={inputClass}
        />
        <p id={`${baseId}-compareAtPrice-hint`} className={`mt-1 font-sans text-xs ${compareAtHidden ? "text-amber-800" : "text-brand-slate/70"}`}>
          {compareAtHidden
            ? `No se verá como oferta: debe ser mayor al precio de tienda (${formatPrice(storePrice!)}).`
            : `Opcional. Se muestra tachado junto al precio de tienda (Precio ${storeList}${
                storePrice !== null ? `: ${formatPrice(storePrice)}` : ""
              }).`}
        </p>
      </div>
    </fieldset>
  );
}
