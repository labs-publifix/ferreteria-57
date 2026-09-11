import {
  Cog,
  Droplets,
  Hammer,
  KeyRound,
  Lightbulb,
  PaintBucket,
  ShieldCheck,
  Sprout,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Mismo catálogo de 10 íconos que ya usaba CategoryGrid.tsx (Home) antes
// de que las categorías vinieran de Supabase — la única diferencia es que
// ahora la llave es el NOMBRE del ícono (columna categories.icon), nunca
// el label en español: así un admin puede renombrar una categoría sin que
// el ícono quede huérfano (antes CategoryGrid indexaba este mismo mapa
// por category.label directo).
export const CATEGORY_ICON_OPTIONS: { value: string; icon: LucideIcon }[] = [
  { value: "Lightbulb", icon: Lightbulb },
  { value: "Zap", icon: Zap },
  { value: "Wrench", icon: Wrench },
  { value: "Sprout", icon: Sprout },
  { value: "ShieldCheck", icon: ShieldCheck },
  { value: "Cog", icon: Cog },
  { value: "PaintBucket", icon: PaintBucket },
  { value: "KeyRound", icon: KeyRound },
  { value: "Hammer", icon: Hammer },
  { value: "Droplets", icon: Droplets },
];

export const CATEGORY_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.value, option.icon])
);
