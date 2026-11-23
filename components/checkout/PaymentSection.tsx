"use client";

import Link from "next/link";
import { Building2, Calendar, Check, CreditCard, type LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

export type PaymentMethod = "tarjeta" | "msi" | "empresa";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const BASE_OPTIONS: PaymentOption[] = [
  {
    value: "tarjeta",
    label: "Tarjeta de crédito o débito",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
  },
  {
    value: "msi",
    label: "Meses sin intereses",
    description: "Próximamente",
    icon: Calendar,
    disabled: true,
  },
];

/** Club 57 Empresarial: datos para la opción «Cargo a mi empresa». */
export interface EmpresaPaymentOption {
  nombre: string;
  disponible: number;
  /** Si viene, la opción se muestra deshabilitada con este motivo. */
  disabledReason: string | null;
  plazoDias: number;
  cuentaEmail: string;
}

// El cobro con tarjeta corre en Mercado Pago (Checkout Pro, ver
// app/(site)/checkout/actions.ts): esta sección solo deja elegido el
// método antes de redirigir a pagar, la tarjeta en sí se captura del otro
// lado. MSI se deja visible pero deshabilitado como adelanto de lo que
// viene. «Cargo a mi empresa» solo aparece para empleados con empresa
// vinculada activa (Club 57 Empresarial) y no pasa por Mercado Pago.
export function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  empresa = null,
  showLoginHint = false,
}: {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  empresa?: EmpresaPaymentOption | null;
  /** Visitante sin sesión: se le recuerda que el cargo a empresa pide iniciar sesión. */
  showLoginHint?: boolean;
}) {
  const options: PaymentOption[] = empresa
    ? [
        {
          value: "empresa",
          label: `Cargo a mi empresa · ${empresa.nombre}`,
          description: empresa.disabledReason ?? `Crédito disponible: ${formatPrice(empresa.disponible)}`,
          icon: Building2,
          disabled: Boolean(empresa.disabledReason),
        },
        ...BASE_OPTIONS,
      ]
    : BASE_OPTIONS;
  const empresaSelected = paymentMethod === "empresa" && empresa && !empresa.disabledReason;

  return (
    <section aria-labelledby="pago-heading">
      <h2 id="pago-heading" className="mb-4 font-display text-lg uppercase text-brand-slate">
        Método de pago
      </h2>

      <div role="radiogroup" aria-label="Método de pago" className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = paymentMethod === option.value && !option.disabled;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={option.disabled}
              disabled={option.disabled}
              onClick={() => !option.disabled && onPaymentMethodChange(option.value)}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 ${
                option.disabled
                  ? "cursor-not-allowed border-brand-slate/15 opacity-60"
                  : isSelected
                    ? "border-brand-orange bg-brand-orange/10"
                    : "border-brand-slate/30 hover:border-brand-slate"
              }`}
            >
              <Icon className="size-5 shrink-0 text-brand-slate" aria-hidden="true" strokeWidth={1.75} />
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-sm font-semibold text-brand-black">{option.label}</span>
                <span className="block font-sans text-xs text-brand-slate/70">{option.description}</span>
              </span>
              {!option.disabled && (
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-brand-orange bg-brand-orange" : "border-brand-slate/40"
                  }`}
                >
                  {isSelected && <Check className="size-3.5 text-brand-black" strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {empresaSelected ? (
        <div className="mt-3 rounded-md bg-brand-gray px-4 py-3 font-sans text-xs text-brand-slate">
          <p>
            Tu pedido queda <strong className="text-brand-black">en espera de autorización</strong>: {empresa.nombre} tiene hasta{" "}
            {empresa.plazoDias} {empresa.plazoDias === 1 ? "día hábil" : "días hábiles"} para autorizarlo. Cuando lo autorice, lo
            preparamos. No se cobra al entregar.
          </p>
          <p className="mt-1">El pedido se guarda en tu cuenta ({empresa.cuentaEmail}).</p>
        </div>
      ) : (
        <p className="mt-3 font-sans text-xs text-brand-slate/60">
          Se te redirigirá a Mercado Pago para completar tu pago de forma segura.
        </p>
      )}
      {showLoginHint && (
        <p className="mt-2 font-sans text-xs text-brand-slate">
          ¿Compras con cargo a tu empresa (Club 57 Empresarial)?{" "}
          <Link href="/cuenta?next=/checkout" className="font-semibold text-brand-black underline underline-offset-2">
            Inicia sesión
          </Link>
          .
        </p>
      )}
    </section>
  );
}
