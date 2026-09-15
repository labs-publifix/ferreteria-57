// Constantes de negocio del checkout de 3 modalidades — un solo lugar
// para los montos, así BLOQUE 2/3 del checkout y /carrito (teaser de envío
// gratis) nunca queden con números distintos entre sí.

// Filas especiales de la tabla zonas_envio (ver supabase/migrations/
// 20260915010000_zonas_envio.sql): no son colonias reales, son casos de
// negocio — se excluyen del combobox de colonias y se tratan aquí como
// constantes, no como datos que vengan "sueltos" de la base.
export const PICKUP_TIENDA_KEY = "__PICKUP_TIENDA__";
export const NO_LISTADA_KEY = "__NO_LISTADA__";
export const FORANEO_KEY = "__FORANEO__";

// $169 fijo cuando el cliente no encuentra su colonia en el combobox
// (envío local, flujo 2).
export const NO_LISTADA_COST = 169;

// $250 fijo para envío foráneo (flujo 3) — no depende de colonia ni se ve
// afectado por la promoción de envío gratis (esa promoción es solo para
// envío local, flujo 2).
export const FORANEO_COST = 250;

// A partir de este subtotal, envío foráneo YA NO se cotiza en automático
// con el costo fijo — hay que escalar por WhatsApp para cotización manual.
export const FORANEO_MAX_STANDARD = 4000;

// A partir de este subtotal, el envío local (colonia real o "no listada")
// se vuelve gratis.
export const FREE_SHIPPING_THRESHOLD = 599;
