// Fuente única de verdad para los datos reales de la tienda física: evita
// que Footer y la sección "Visítanos" del Home puedan quedar
// desincronizados si la dirección, el teléfono o el horario cambian.
export const STORE_ADDRESS =
  "Lateral Carretera Federal No. 57 230, Casa Blanca, 76030 Santiago de Querétaro, Qro.";

export const STORE_PHONE_DISPLAY = "442 778 2708";
export const STORE_PHONE_TEL = "+524427782708";

export const STORE_HORARIO = [
  "Lunes a viernes: 8:00 am – 7:00 pm",
  "Sábados: 8:00 am – 3:00 pm",
  "Domingo: cerrado",
];

// Búsqueda directa del negocio en Google Maps (reseñas, ficha pública).
export const GOOGLE_MAPS_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=Ferreteria+57+Santiago+de+Queretaro";

// Direcciones hacia la dirección real, distinto de la búsqueda de reseñas:
// aquí sí importa la dirección exacta, no solo el nombre del negocio.
export const GOOGLE_MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  STORE_ADDRESS
)}`;

// Embed simple sin API key (google.com/maps?...&output=embed): suficiente
// para un iframe de ubicación, no requiere una cuenta de Google Cloud.
export const GOOGLE_MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(
  STORE_ADDRESS
)}&output=embed`;
