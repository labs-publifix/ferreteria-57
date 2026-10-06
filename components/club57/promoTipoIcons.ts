import { CalendarDays, Tags, Wrench, type LucideIcon } from "lucide-react";
import type { PromoTipo } from "@/lib/club57/promociones/config";

// Mismo ícono por tipo en el panel admin y en las tarjetas del miembro.
export const PROMO_TIPO_ICON: Record<PromoTipo, LucideIcon> = {
  promo_truper: Wrench,
  promo_temporada: CalendarDays,
  liquidaciones: Tags,
};
