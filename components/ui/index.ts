export { Button } from "./Button";
export type { ButtonProps, ButtonVariant } from "./Button";
// buttonClassName vive en su propio módulo sin "use client" (ver
// buttonStyles.ts): un Server Component que la importara desde Button.tsx
// la recibiría como referencia de cliente opaca, no como la función real.
export { buttonClassName } from "./buttonStyles";
export { Badge } from "./Badge";
export type { BadgeProps } from "./Badge";
export { PriceTag } from "./PriceTag";
export type { PriceTagProps } from "./PriceTag";
export { RatingStars } from "./RatingStars";
export type { RatingStarsProps } from "./RatingStars";
export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";
export { ProductImagePlaceholder } from "./ProductImagePlaceholder";
export { ToastProvider, useToast } from "./ToastProvider";
export { PasswordInput } from "./PasswordInput";
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";
