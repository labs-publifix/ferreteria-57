// Base compartida para comparar texto sin importar acentos/mayúsculas:
// usada por slugify (generar el slug) y por la resolución de categoría y
// detección de marca del importador (comparar "Mecanica" contra "Mecánica",
// "PRETUL" contra "Pretul"). Un solo lugar para el truco de Unicode NFD +
// el rango de marcas diacríticas (u0300 a u036f) que normalize() separa
// del carácter base, en vez de repetirlo en cada archivo.
export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Trim + sin acentos + minúsculas: la forma canónica para comparar dos
// textos "iguales para un humano" (nombre de categoría, marca) que pueden
// venir con espacios de más o sin acentos en un Excel cargado a mano.
export function normalizeText(value: string): string {
  return stripAccents(value).trim().toLowerCase();
}
