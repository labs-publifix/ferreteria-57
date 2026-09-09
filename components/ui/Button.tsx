"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { buttonClassName } from "./buttonStyles";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonClassName(variant, className)}
        {...rest}
      />
    );
  }
);

Button.displayName = "Button";
