// Un solo lugar para "qué cuenta como stock bajo" — el dashboard de
// /admin (Inicio) y el filtro de /admin/productos deben coincidir
// exactamente en la definición, o el número de la tarjeta y lo que
// realmente aparece al hacer clic en su link no cuadrarían.
export const LOW_STOCK_THRESHOLD = 5;

// 0 cuenta como "bajo" (no es un caso aparte): <=5 ya lo cubre.
export function hasLowStock(variants: { stock: number }[]): boolean {
  return variants.some((variant) => variant.stock <= LOW_STOCK_THRESHOLD);
}
