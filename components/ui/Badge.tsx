import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

// Pensado para superponerse a la esquina de una imagen de producto
// (el padre lo posiciona, p. ej. className="absolute top-2 right-2"),
// y también se reutiliza en línea dentro de PriceTag.
// Texto negro-suave sobre naranja: 5.93:1 de contraste (pasa AA 4.5:1),
// a diferencia del texto blanco pedido explícitamente para Button.
export function Badge({ children, className = "", ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full bg-brand-orange px-2.5 py-1 font-sans text-xs font-bold text-brand-black sm:text-sm ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
