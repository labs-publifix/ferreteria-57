"use client";

import { useId } from "react";
import { STORE_ADDRESS, STORE_HORARIO } from "@/lib/store-info";

export type DeliveryMethod = "envio" | "retiro";

export interface AddressForm {
  firstName: string;
  lastName: string;
  street: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
}

export const emptyAddress: AddressForm = {
  firstName: "",
  lastName: "",
  street: "",
  neighborhood: "",
  postalCode: "",
  city: "",
  state: "",
};

function AddressField({
  label,
  value,
  onChange,
  className = "",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputMode?: "text" | "numeric";
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-medium text-brand-black">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate"
      />
    </div>
  );
}

export function DeliverySection({
  deliveryMethod,
  onDeliveryMethodChange,
  address,
  onAddressChange,
}: {
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  address: AddressForm;
  onAddressChange: (address: AddressForm) => void;
}) {
  function updateField(field: keyof AddressForm, value: string) {
    onAddressChange({ ...address, [field]: value });
  }

  return (
    <section aria-labelledby="entrega-heading">
      <h2
        id="entrega-heading"
        className="mb-4 font-display text-lg uppercase text-brand-slate"
      >
        Entrega
      </h2>

      {/* Pills/tabs: mismo patrón visual de selección binaria que ya usa
          el selector de variante en la ficha de producto. */}
      <div
        role="radiogroup"
        aria-label="Método de entrega"
        className="mb-4 grid grid-cols-2 gap-2"
      >
        {(
          [
            { value: "envio" as const, label: "Envío" },
            { value: "retiro" as const, label: "Retiro en tienda" },
          ]
        ).map((option) => {
          const isSelected = deliveryMethod === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onDeliveryMethodChange(option.value)}
              className={`flex min-h-11 items-center justify-center rounded-md border-2 px-4 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
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

      {deliveryMethod === "envio" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AddressField
            label="Nombre"
            value={address.firstName}
            onChange={(value) => updateField("firstName", value)}
          />
          <AddressField
            label="Apellidos"
            value={address.lastName}
            onChange={(value) => updateField("lastName", value)}
          />
          <AddressField
            label="Calle y número"
            value={address.street}
            onChange={(value) => updateField("street", value)}
            className="sm:col-span-2"
          />
          <AddressField
            label="Colonia"
            value={address.neighborhood}
            onChange={(value) => updateField("neighborhood", value)}
          />
          <AddressField
            label="Código postal"
            value={address.postalCode}
            onChange={(value) => updateField("postalCode", value)}
            inputMode="numeric"
          />
          <AddressField
            label="Ciudad"
            value={address.city}
            onChange={(value) => updateField("city", value)}
          />
          <AddressField
            label="Estado"
            value={address.state}
            onChange={(value) => updateField("state", value)}
          />
        </div>
      ) : (
        <div className="rounded-lg bg-brand-gray p-4">
          <p className="font-sans text-sm font-semibold text-brand-black">
            Ferretería 57
          </p>
          <p className="mt-1 font-sans text-sm text-brand-slate">
            {STORE_ADDRESS}
          </p>
          <ul className="mt-3 flex flex-col gap-0.5 font-sans text-sm text-brand-slate">
            {STORE_HORARIO.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
