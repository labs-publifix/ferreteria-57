// Validación pura de los formularios del checkout — separada de la UI para
// poder calcular un `disabled` real en el botón de avanzar (requisito
// explícito del flujo 2), en vez de depender solo de la validación nativa
// del navegador, que bloquea el submit pero no deshabilita visualmente nada.

export interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Exportadas (no solo usadas internamente) para que los campos de
// Contacto/Entrega puedan mostrar un error específico por campo en vez
// de solo el aviso genérico de "faltan campos" — un valor con formato
// inválido (p. ej. un teléfono a 8 dígitos) no es un campo vacío, así que
// el asterisco de obligatorio no basta para explicar por qué el botón
// sigue deshabilitado.
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

// Se acepta cualquier formato de captura (espacios, guiones, paréntesis) y
// solo se exige que, al quitar todo lo que no sea dígito, queden al menos
// 10 — un celular mexicano sin lada de país.
export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

export function isValidPostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode.trim());
}

// Compartido por los 3 flujos: Nombre, Apellido, Email y Teléfono móvil,
// todos obligatorios.
export function isContactValid(contact: ContactForm): boolean {
  return (
    contact.firstName.trim() !== "" &&
    contact.lastName.trim() !== "" &&
    isValidEmail(contact.email) &&
    isValidPhone(contact.phone)
  );
}

export interface LocalAddressForm {
  colonia: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  references: string;
}

// interiorNumber queda fuera a propósito: es opcional (no todas las
// direcciones tienen uno) y no debe bloquear el avance.
export function isLocalAddressValid(address: LocalAddressForm): boolean {
  return (
    address.colonia.trim() !== "" &&
    address.street.trim() !== "" &&
    address.exteriorNumber.trim() !== "" &&
    isValidPostalCode(address.postalCode) &&
    address.references.trim() !== ""
  );
}

export interface ForaneoAddressForm {
  state: string;
  city: string;
  colonia: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  postalCode: string;
  references: string;
}

export function isForaneoAddressValid(address: ForaneoAddressForm): boolean {
  return (
    address.state.trim() !== "" &&
    address.city.trim() !== "" &&
    address.colonia.trim() !== "" &&
    address.street.trim() !== "" &&
    address.exteriorNumber.trim() !== "" &&
    isValidPostalCode(address.postalCode) &&
    address.references.trim() !== ""
  );
}
