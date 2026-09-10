"use client";

import { Banknote, Calendar, Check, CreditCard, type LucideIcon } from "lucide-react";

export type PaymentMethod = "tarjeta" | "msi" | "oxxo";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "tarjeta",
    label: "Tarjeta de crédito o débito",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
  },
  {
    value: "msi",
    label: "Meses sin intereses",
    description: "Disponible con tarjetas participantes",
    icon: Calendar,
  },
  {
    value: "oxxo",
    label: "Pago en efectivo (OXXO)",
    description: "Genera un código para pagar en tienda",
    icon: Banknote,
  },
];

// Solo visual por ahora: la integración real con Mercado Pago (cargos,
// validación de tarjeta, generación del código OXXO) es una fase
// posterior — aquí únicamente se guarda cuál tarjeta quedó seleccionada,
// sin procesar nada.
export function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
}: {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}) {
  return (
    <section aria-labelledby="pago-heading">
      <h2
        id="pago-heading"
        className="mb-4 font-display text-lg uppercase text-brand-slate"
      >
        Método de pago
      </h2>

      <div role="radiogroup" aria-label="Método de pago" className="flex flex-col gap-2">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = paymentMethod === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onPaymentMethodChange(option.value)}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand-orange bg-brand-orange/10"
                  : "border-brand-slate/30 hover:border-brand-slate"
              }`}
            >
              <Icon className="size-5 shrink-0 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
              <span className="flex-1">
                <span className="block font-sans text-sm font-semibold text-brand-black">
                  {option.label}
                </span>
                <span className="block font-sans text-xs text-brand-slate/70">
                  {option.description}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-brand-orange bg-brand-orange" : "border-brand-slate/40"
                }`}
              >
                {isSelected && <Check className="size-3.5 text-brand-black" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 font-sans text-xs text-brand-slate/60">
        Pago simulado — la integración con Mercado Pago se conecta en una
        fase posterior.
      </p>
    </section>
  );
}
