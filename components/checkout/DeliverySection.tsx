"use client";

import { useId, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Combobox, Select } from "@/components/ui";
import { STORE_ADDRESS, STORE_HORARIO } from "@/lib/store-info";
import { MEXICAN_STATES_EXCLUDING_QUERETARO } from "@/lib/checkout/mexicanStates";
import { FORANEO_COST, NO_LISTADA_KEY } from "@/lib/checkout/constants";
import { amountRemainingForFreeShipping } from "@/lib/checkout/shippingCalculator";
import { isValidPostalCode } from "@/lib/checkout/validation";
import { formatPrice } from "@/lib/formatPrice";
import type { ZonaEnvio } from "@/lib/checkout/useZonasEnvio";

export type DeliveryMethod = "retiro" | "envio_local" | "envio_foraneo";

export interface LocalAddressForm {
  colonia: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  references: string;
}

export const emptyLocalAddress: LocalAddressForm = {
  colonia: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  postalCode: "",
  references: "",
};

export interface ForaneoAddressForm {
  state: string;
  city: string;
  colonia: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  references: string;
}

export const emptyForaneoAddress: ForaneoAddressForm = {
  state: "",
  city: "",
  colonia: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  postalCode: "",
  references: "",
};

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "retiro", label: "Retiro en tienda" },
  { value: "envio_local", label: "Envío local (Querétaro)" },
  { value: "envio_foraneo", label: "Envío foráneo" },
];

function Field({
  label,
  value,
  onChange,
  className = "",
  inputMode,
  required = true,
  readOnly = false,
  as = "input",
  error,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  inputMode?: "text" | "numeric";
  required?: boolean;
  readOnly?: boolean;
  as?: "input" | "textarea";
  /** Mensaje a mostrar cuando el campo, ya visitado, no es válido. */
  error?: string;
}) {
  const id = useId();
  const errorId = useId();
  // "Tocado" recién al salir del campo (blur), no en cada tecla — mostrar
  // el error desde la primera letra escrita sería ruidoso. Un campo con
  // formato inválido (p. ej. un C.P. a 4 dígitos) no se ve distinto de uno
  // válido a simple vista, a diferencia de uno vacío — de ahí que no baste
  // con el asterisco de obligatorio para explicar por qué el botón de
  // avanzar sigue deshabilitado.
  const [touched, setTouched] = useState(false);
  const showError = touched && Boolean(error);
  const sharedClassName = `w-full rounded-md border px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate read-only:bg-brand-gray read-only:text-brand-slate ${
    showError ? "border-red-500" : "border-brand-slate/30"
  }`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
        {label}
        {required ? (
          <span className="text-brand-orange" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-brand-slate/60"> (opcional)</span>
        )}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          required={required}
          readOnly={readOnly}
          rows={2}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={sharedClassName}
        />
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          readOnly={readOnly}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className={sharedClassName}
        />
      )}
      {showError && (
        <p id={errorId} className="mt-1 font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function DeliverySection({
  deliveryMethod,
  onDeliveryMethodChange,
  localAddress,
  onLocalAddressChange,
  foraneoAddress,
  onForaneoAddressChange,
  zonas,
  subtotal,
  foraneoOverLimit,
  whatsappUrl,
}: {
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  localAddress: LocalAddressForm;
  onLocalAddressChange: (address: LocalAddressForm) => void;
  foraneoAddress: ForaneoAddressForm;
  onForaneoAddressChange: (address: ForaneoAddressForm) => void;
  zonas: ZonaEnvio[];
  subtotal: number;
  foraneoOverLimit: boolean;
  whatsappUrl: string;
}) {
  // "Tocado" para el Select de Estado, igual que el resto de los campos:
  // ver el bug reportado en Select.tsx — antes de ese fix, el botón
  // mostraba "Aguascalientes" (options[0]) sin que la persona hubiera
  // elegido nada, así que ni el asterisco ni un error visible eran
  // suficientes para explicar por qué el checkout seguía bloqueado.
  const [stateTouched, setStateTouched] = useState(false);

  function updateLocalField(field: keyof LocalAddressForm, value: string) {
    onLocalAddressChange({ ...localAddress, [field]: value });
  }
  function updateForaneoField(field: keyof ForaneoAddressForm, value: string) {
    onForaneoAddressChange({ ...foraneoAddress, [field]: value });
  }

  const coloniaOptions = zonas.map((zona) => ({
    value: zona.colonia,
    label: `${zona.colonia} — ${formatPrice(zona.costoEnvioMxn)}`,
  }));

  const remainingForFreeShipping = amountRemainingForFreeShipping(subtotal);

  return (
    <section aria-labelledby="entrega-heading">
      <h2 id="entrega-heading" className="mb-4 font-display text-lg uppercase text-brand-slate">
        Entrega
      </h2>

      {/* 3 modalidades, "Retiro en tienda" preseleccionada por default y
          siempre primera — cada una despliega un bloque de campos propio,
          sin lógica compartida entre ellas. */}
      <div
        role="radiogroup"
        aria-label="Método de entrega"
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {DELIVERY_OPTIONS.map((option) => {
          const isSelected = deliveryMethod === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onDeliveryMethodChange(option.value)}
              className={`flex min-h-11 items-center justify-center rounded-md border-2 px-3 py-2 text-center font-sans text-sm font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand-orange bg-brand-orange/10 text-brand-black"
                  : "border-brand-slate/30 text-brand-slate hover:border-brand-slate"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {deliveryMethod === "retiro" && (
        <div className="rounded-lg bg-brand-gray p-4">
          <p className="font-sans text-sm font-semibold text-brand-black">Ferretería 57</p>
          <p className="mt-1 font-sans text-sm text-brand-slate">{STORE_ADDRESS}</p>
          <ul className="mt-3 flex flex-col gap-0.5 font-sans text-sm text-brand-slate">
            {STORE_HORARIO.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-sm font-semibold text-brand-black">
            Retiro en tienda: gratis.
          </p>
        </div>
      )}

      {deliveryMethod === "envio_local" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ciudad" value="Querétaro" readOnly onChange={() => {}} />
            <div>
              <label className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
                Colonia
                <span className="text-brand-orange" aria-hidden="true">
                  {" "}
                  *
                </span>
              </label>
              <Combobox
                value={localAddress.colonia}
                onChange={(value) => updateLocalField("colonia", value)}
                options={coloniaOptions}
                label="Colonia"
                placeholder="Busca tu colonia"
                emptyMessage="No encontramos esa colonia"
                pinnedOption={{ value: NO_LISTADA_KEY, label: "Mi colonia no aparece en la lista" }}
                required
              />
            </div>
            <Field
              label="Calle"
              value={localAddress.street}
              onChange={(value) => updateLocalField("street", value)}
              error={localAddress.street.trim() === "" ? "Ingresa tu calle." : undefined}
            />
            <Field
              label="No. Exterior"
              value={localAddress.exteriorNumber}
              onChange={(value) => updateLocalField("exteriorNumber", value)}
              inputMode="numeric"
              error={localAddress.exteriorNumber.trim() === "" ? "Ingresa el número exterior." : undefined}
            />
            <Field
              label="No. Interior"
              value={localAddress.interiorNumber}
              onChange={(value) => updateLocalField("interiorNumber", value)}
              inputMode="numeric"
              required={false}
            />
            <Field
              label="Código postal"
              value={localAddress.postalCode}
              onChange={(value) => updateLocalField("postalCode", value)}
              inputMode="numeric"
              error={
                localAddress.postalCode.trim() === ""
                  ? "Ingresa el código postal."
                  : !isValidPostalCode(localAddress.postalCode)
                    ? "Ingresa un código postal a 5 dígitos."
                    : undefined
              }
            />
            <Field
              as="textarea"
              label="Referencias de entrega"
              value={localAddress.references}
              onChange={(value) => updateLocalField("references", value)}
              className="sm:col-span-2"
              error={localAddress.references.trim() === "" ? "Ingresa una referencia de entrega." : undefined}
            />
          </div>

          <p
            className={`rounded-md px-4 py-2.5 font-sans text-sm font-semibold ${
              remainingForFreeShipping > 0
                ? "bg-brand-gray text-brand-slate"
                : "bg-brand-orange/10 text-brand-black"
            }`}
          >
            {remainingForFreeShipping > 0
              ? `Te faltan ${formatPrice(remainingForFreeShipping)} para obtener envío gratis`
              : "¡Tu pedido calificó para envío gratis!"}
          </p>
        </div>
      )}

      {deliveryMethod === "envio_foraneo" &&
        (foraneoOverLimit ? (
          // Por encima del monto máximo no hay checkout estándar que
          // completar (ver CheckoutView: canSubmit ya es false y los
          // botones de confirmar se ocultan) — pedir Estado/Ciudad/Calle/
          // etc. en ese momento sería llenar un formulario para nada. En
          // su lugar, todo el peso va al CTA de WhatsApp.
          <div className="flex flex-col items-start gap-3 rounded-lg border-2 border-brand-orange/50 bg-brand-orange/10 p-5">
            <p className="font-sans text-base font-semibold text-brand-black">
              Tu pedido ({formatPrice(subtotal)}) supera el monto máximo para envío foráneo
              estándar.
            </p>
            <p className="font-sans text-sm text-brand-slate">
              Contáctanos por WhatsApp con los datos de tu pedido y te ayudamos a cotizar el
              envío — no necesitas llenar tu dirección aquí todavía.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-fit items-center gap-2 rounded-md bg-brand-orange px-5 font-sans text-sm font-semibold text-brand-black transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="size-4" aria-hidden="true" strokeWidth={1.75} />
              Cotizar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
                  Estado
                  <span className="text-brand-orange" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </label>
                <Select
                  value={foraneoAddress.state}
                  onChange={(value) => updateForaneoField("state", value)}
                  options={MEXICAN_STATES_EXCLUDING_QUERETARO.map((state) => ({
                    value: state,
                    label: state,
                  }))}
                  label="Estado"
                  placeholder="Selecciona tu estado"
                  onBlur={() => setStateTouched(true)}
                />
                {stateTouched && foraneoAddress.state.trim() === "" && (
                  <p className="mt-1 font-sans text-xs text-red-600">Selecciona tu estado.</p>
                )}
              </div>
              <Field
                label="Ciudad"
                value={foraneoAddress.city}
                onChange={(value) => updateForaneoField("city", value)}
                error={foraneoAddress.city.trim() === "" ? "Ingresa tu ciudad." : undefined}
              />
              <Field
                label="Colonia"
                value={foraneoAddress.colonia}
                onChange={(value) => updateForaneoField("colonia", value)}
                error={foraneoAddress.colonia.trim() === "" ? "Ingresa tu colonia." : undefined}
              />
              <Field
                label="Calle"
                value={foraneoAddress.street}
                onChange={(value) => updateForaneoField("street", value)}
                error={foraneoAddress.street.trim() === "" ? "Ingresa tu calle." : undefined}
              />
              <Field
                label="No. Exterior"
                value={foraneoAddress.exteriorNumber}
                onChange={(value) => updateForaneoField("exteriorNumber", value)}
                inputMode="numeric"
                error={
                  foraneoAddress.exteriorNumber.trim() === "" ? "Ingresa el número exterior." : undefined
                }
              />
              <Field
                label="No. Interior"
                value={foraneoAddress.interiorNumber}
                onChange={(value) => updateForaneoField("interiorNumber", value)}
                inputMode="numeric"
                required={false}
              />
              <Field
                label="Código postal"
                value={foraneoAddress.postalCode}
                onChange={(value) => updateForaneoField("postalCode", value)}
                inputMode="numeric"
                error={
                  foraneoAddress.postalCode.trim() === ""
                    ? "Ingresa el código postal."
                    : !isValidPostalCode(foraneoAddress.postalCode)
                      ? "Ingresa un código postal a 5 dígitos."
                      : undefined
                }
              />
              <Field
                as="textarea"
                label="Referencias de entrega"
                value={foraneoAddress.references}
                onChange={(value) => updateForaneoField("references", value)}
                className="sm:col-span-2"
                error={
                  foraneoAddress.references.trim() === "" ? "Ingresa una referencia de entrega." : undefined
                }
              />
            </div>

            <p className="rounded-md bg-brand-gray px-4 py-2.5 font-sans text-sm font-semibold text-brand-black">
              Costo de envío foráneo: {formatPrice(FORANEO_COST)}
            </p>
          </div>
        ))}
    </section>
  );
}
