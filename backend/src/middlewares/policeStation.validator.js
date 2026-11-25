"use strict";

const AppError = require("../utils/appError");

// Letras (con acentos), números, espacios y signos básicos . , ' ( ) # - /
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/;

// Al menos una letra (no se acepta solo números o solo signos)
const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

// 10 dígitos; se permiten espacios y guiones entre ellos
const PHONE_PATTERN = /^[0-9 -]+$/;

const ALLOWED_POLICE_TYPES = [
    "modulo",
    "estacion",
    "comandancia"
];

const ALLOWED_POLICE_STATUSES = [
    "activo",
    "inactivo"
];

const ALLOWED_FIELDS = [
    "name",
    "type",
    "status",
    "phone",
    "address",
    "officers"
];

// Validación del body (POST completo / PATCH parcial)
function validatePoliceStationPayload(options = {}) {
    const { partial = false } = options;

    return function policeStationPayloadValidator(req, res, next) {
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

        // Tipo
        if (body.type !== undefined && !ALLOWED_POLICE_TYPES.includes(body.type)) {
            errors.push(
                `El tipo debe ser uno de los siguientes: ${ALLOWED_POLICE_TYPES.join(", ")}.`
            );
        }

        // Estado
        if (body.status !== undefined && !ALLOWED_POLICE_STATUSES.includes(body.status)) {
            errors.push(
                `El estado debe ser uno de los siguientes: ${ALLOWED_POLICE_STATUSES.join(", ")}.`
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

        // Número de elementos
        if (body.officers !== undefined) {
            const value = Number(body.officers);

            // "" o null se convertirían en 0, por eso se revisan aparte
            if (body.officers === "" || body.officers === null || !Number.isFinite(value) || !Number.isInteger(value)) {
                errors.push("El número de elementos debe ser un número entero.");
            } else if (value < 0) {
                errors.push("El número de elementos no puede ser negativo.");
            } else if (value > 2000) {
                errors.push("El número de elementos no puede ser mayor a 2000.");
            } else {
                req.body.officers = value;
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
function validatePoliceStationQuery(req, res, next) {
    const { search, type, status } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== "string") {
        errors.push("El parámetro search debe ser texto.");
    }

    if (type !== undefined && type !== "all" && !ALLOWED_POLICE_TYPES.includes(type)) {
        errors.push("El tipo de filtrado no es válido.");
    }

    if (status !== undefined && status !== "all" && !ALLOWED_POLICE_STATUSES.includes(status)) {
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
    validatePoliceStationPayload,
    validatePoliceStationQuery,
    ALLOWED_POLICE_TYPES,
    ALLOWED_POLICE_STATUSES
};
