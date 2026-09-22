import { randomBytes } from "node:crypto";

// Alfabeto sin caracteres ambiguos al leerse en voz alta o copiarse a mano
// (sin 0/O, 1/l/I) — pensado para una contraseña temporal que un vendedor
// le dicta o entrega por escrito al cliente en el momento del alta.
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

// 14 caracteres de este alfabeto (~59 símbolos) dan ~82 bits de entropía —
// de sobra para una contraseña temporal de un solo uso que el cliente
// debe cambiar en su primer inicio de sesión. randomBytes (CSPRNG) es la
// fuente de aleatoriedad real; el módulo introduce un sesgo mínimo
// (irrelevante a esta longitud/alfabeto) a cambio de no depender de
// crypto.randomInt, que en algunas versiones de Node requiere manejo de
// rango asíncrono aparte.
export function generateSecurePassword(length = 14): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}
