"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseStyles =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-2 " +
  "font-sans text-base font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

// Contraste verificado (WCAG): blanco sobre #FF6600 da ~2.94:1, por debajo
// del mínimo 4.5:1 para texto normal (ambas skills instaladas lo marcan
// severidad alta/crítica). El cliente autorizó el ajuste: texto negro-suave
// da 5.93:1 y pasa AA. El hex del naranja no se tocó, solo el color de texto.
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-orange text-brand-black hover:bg-[#E65C00] active:bg-[#CC5200]",
  secondary:
    "border-2 border-brand-slate bg-transparent text-brand-slate hover:bg-brand-slate hover:text-white active:bg-[#33424A]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...rest}
      />
    );
  }
);

Button.displayName = "Button";
