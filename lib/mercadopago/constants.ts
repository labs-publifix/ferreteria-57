// Compartido entre el endpoint que inicia la autorización y el callback
// que la recibe — un solo lugar que define el nombre de la cookie de
// `state` y su vigencia, para que ambos extremos nunca puedan desalinearse.
export const MP_OAUTH_STATE_COOKIE = "mp_oauth_state";
export const MP_OAUTH_STATE_MAX_AGE_SECONDS = 5 * 60;

// Un token se refresca si le quedan menos de 5 minutos de vida — margen
// para que nunca se use un access_token que vence a medio request (p. ej.
// justo al crear una preferencia de pago).
export const MP_TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
