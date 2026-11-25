"use strict";

const AppError = require("../utils/appError");

// Letras (con acentos), números, espacios y signos básicos . , ' ( ) # - /
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/;

// Al menos una letra (no se acepta solo números o solo signos)
const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

// 10 dígitos; se permiten espacios y guiones entre ellos
const PHONE_PATTERN = /^[0-9 -]+$/;

// "24 horas" o "HH:MM - HH:MM" con horas de 00 a 23 y minutos de 00 a 59
const SCHEDULE_PATTERN = /^(24 horas|([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)$/i;

const ALLOWED_PHARMACY_STATUSES = [
    "abierta",
    "cerrada"
];

const ALLOWED_FIELDS = [
    "name",
    "status",
    "phone",
    "address",
    "schedule"
];

// Validación del body (POST completo / PATCH parcial)
function validatePharmacyPayload(options = {}) {
    const { partial = false } = options;

    return function pharmacyPayloadValidator(req, res, next) {
        const errors = [];
        const body = req.body || {};

        const providedFields = ALLOWED_FIELDS.filter(
            (field) => body[field] !== undefined
        );

        if (partial && providedFields.length === 0) {
            errors.push("Debes proporcionar al menos un campo para actualizar.");
        }

        if (!partial) {
            ALLOWED_FIELDS.forEach((field) => {
                if (
                    body[field] === undefined ||
                    body[field] === null ||
                    body[field] === ""
                ) {
                    errors.push(`El campo "${field}" es obligatorio.`);
                }
            });
        }

        // Nombre
        if (body.name !== undefined) {
            if (typeof body.name !== "string" || body.name.trim().length < 4) {
                errors.push("El nombre debe contener al menos 4 caracteres.");
            } else if (body.name.trim().length > 100) {
                errors.push("El nombre no debe superar los 100 caracteres.");
            } else if (!TEXT_PATTERN.test(body.name.trim()) || !LETTER_PATTERN.test(body.name)) {
                errors.push("El nombre debe tener letras y no puede llevar símbolos especiales.");
            }
        }

        // Estado
        if (body.status !== undefined && !ALLOWED_PHARMACY_STATUSES.includes(body.status)) {
            errors.push(
                `El estado debe ser uno de los siguientes: ${ALLOWED_PHARMACY_STATUSES.join(", ")}.`
            );
        }

        // Teléfono: solo números (con espacios o guiones) y exactamente 10 dígitos
        if (body.phone !== undefined) {
            if (
                typeof body.phone !== "string" ||
                !PHONE_PATTERN.test(body.phone.trim()) ||
                body.phone.replace(/[ -]/g, "").length !== 10
            ) {
                errors.push("El teléfono debe tener 10 dígitos (solo números, espacios o guiones).");
            }
        }

        // Dirección
        if (body.address !== undefined) {
            if (typeof body.address !== "string" || body.address.trim().length < 5) {
                errors.push("La dirección debe contener al menos 5 caracteres.");
            } else if (body.address.trim().length > 200) {
                errors.push("La dirección no debe superar los 200 caracteres.");
            } else if (!TEXT_PATTERN.test(body.address.trim()) || !LETTER_PATTERN.test(body.address)) {
                errors.push("La dirección debe tener letras y no puede llevar símbolos especiales.");
            }
        }

        // Horario: "24 horas" o "HH:MM - HH:MM" (ej. 08:00 - 22:00)
        if (body.schedule !== undefined) {
            if (typeof body.schedule !== "string" || !SCHEDULE_PATTERN.test(body.schedule.trim())) {
                errors.push('El horario debe ser "24 horas" o tener el formato HH:MM - HH:MM (ej. 08:00 - 22:00).');
            }
        }

        const unknownFields = Object.keys(body).filter(
            (field) => !ALLOWED_FIELDS.includes(field)
        );

        if (unknownFields.length > 0) {
            errors.push(
                `Los siguientes campos no son permitidos: ${unknownFields.join(", ")}.`
            );
        }

        if (errors.length > 0) {
            return next(
                new AppError(400, "La información enviada no es válida", errors)
            );
        }

        next();
    };
}

// Validación de los filtros (query string)
function validatePharmacyQuery(req, res, next) {
    const { search, status } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== "string") {
        errors.push("El parámetro search debe ser texto.");
    }

    if (status !== undefined && status !== "all" && !ALLOWED_PHARMACY_STATUSES.includes(status)) {
        errors.push("El estado de filtrado no es válido.");
    }

    if (errors.length > 0) {
        return next(
            new AppError(400, "Los parámetros de consulta no son válidos", errors)
        );
    }

    next();
}

module.exports = {
    validatePharmacyPayload,
    validatePharmacyQuery,
    ALLOWED_PHARMACY_STATUSES
};
