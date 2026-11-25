// Validaciones de los formularios (las mismas reglas que el backend).
// Cada función regresa el mensaje de error, o "" si el valor es correcto.

// Letras (con acentos), números, espacios y signos básicos . , ' ( ) # - /
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/;

// Al menos una letra
const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

// Solo letras y espacios (nombre de persona)
const PERSON_NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

// Solo números, espacios y guiones
const PHONE_PATTERN = /^[0-9 -]+$/;

// "24 horas" o "HH:MM - HH:MM"
const SCHEDULE_PATTERN = /^(24 horas|([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value, minLength = 4) {
  const text = String(value).trim();

  if (text.length < minLength) {
    return `El nombre debe tener al menos ${minLength} caracteres.`;
  }
  if (text.length > 100) {
    return "El nombre no debe superar los 100 caracteres.";
  }
  if (!TEXT_PATTERN.test(text) || !LETTER_PATTERN.test(text)) {
    return "El nombre debe tener letras y no puede llevar símbolos especiales.";
  }
  return "";
}

export function validatePersonName(value) {
  const text = String(value).trim();

  if (text.length < 3) {
    return "El nombre debe tener al menos 3 caracteres.";
  }
  if (text.length > 80) {
    return "El nombre no debe superar los 80 caracteres.";
  }
  if (!PERSON_NAME_PATTERN.test(text)) {
    return "El nombre solo puede contener letras y espacios.";
  }
  return "";
}

export function validateDescription(value) {
  const text = String(value).trim();

  if (text.length < 5) {
    return "La descripción debe tener al menos 5 caracteres.";
  }
  if (text.length > 250) {
    return "La descripción no debe superar los 250 caracteres.";
  }
  if (!LETTER_PATTERN.test(text)) {
    return "La descripción debe contener letras.";
  }
  return "";
}

export function validatePhone(value) {
  const text = String(value).trim();

  if (!PHONE_PATTERN.test(text) || text.replace(/[ -]/g, "").length !== 10) {
    return "El teléfono debe tener 10 dígitos (solo números, espacios o guiones).";
  }
  return "";
}

export function validateAddress(value) {
  const text = String(value).trim();

  if (text.length < 5) {
    return "La dirección debe tener al menos 5 caracteres.";
  }
  if (text.length > 200) {
    return "La dirección no debe superar los 200 caracteres.";
  }
  if (!TEXT_PATTERN.test(text) || !LETTER_PATTERN.test(text)) {
    return "La dirección debe tener letras y no puede llevar símbolos especiales.";
  }
  return "";
}

export function validateSchedule(value) {
  if (!SCHEDULE_PATTERN.test(String(value).trim())) {
    return 'El horario debe ser "24 horas" o tener el formato HH:MM - HH:MM (ej. 08:00 - 22:00).';
  }
  return "";
}

// label = "camas", "unidades", "elementos"
export function validateInteger(value, label, max) {
  if (value === "" || value === null) {
    return `Escribe el número de ${label}.`;
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    return `El número de ${label} debe ser un número entero.`;
  }
  if (number < 0) {
    return `El número de ${label} no puede ser negativo.`;
  }
  if (number > max) {
    return `El número de ${label} no puede ser mayor a ${max}.`;
  }
  return "";
}

export function validateEmail(value) {
  if (!EMAIL_PATTERN.test(String(value).trim())) {
    return "El correo electrónico no es válido.";
  }
  return "";
}

export function validatePassword(value) {
  if (value.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "La contraseña debe tener al menos una letra y un número.";
  }
  return "";
}
