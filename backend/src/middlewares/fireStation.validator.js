"use strict";

const AppError = require("../utils/appError");

// Letras (con acentos), números, espacios y signos básicos . , ' ( ) # - /
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/;

// Al menos una letra (no se acepta solo números o solo signos)
const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

// 10 dígitos; se permiten espacios y guiones entre ellos
const PHONE_PATTERN = /^[0-9 -]+$/;

const ALLOWED_FIRE_STATION_STATUSES = [
    "activa",
    "en_servicio",
    "fuera_de_servicio"
];

const ALLOWED_FIELDS = [
    "name",
    "status",
    "phone",
    "address",
    "units"
];

// Validación del body (POST completo / PATCH parcial)
function validateFireStationPayload(options = {}) {
    const { partial = false } = options;

    return function fireStationPayloadValidator(req, res, next) {
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
        if (body.status !== undefined && !ALLOWED_FIRE_STATION_STATUSES.includes(body.status)) {
            errors.push(
                `El estado debe ser uno de los siguientes: ${ALLOWED_FIRE_STATION_STATUSES.join(", ")}.`
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

        // Número de unidades
        if (body.units !== undefined) {
            const value = Number(body.units);

            // "" o null se convertirían en 0, por eso se revisan aparte
            if (body.units === "" || body.units === null || !Number.isFinite(value) || !Number.isInteger(value)) {
                errors.push("El número de unidades debe ser un número entero.");
            } else if (value < 0) {
                errors.push("El número de unidades no puede ser negativo.");
            } else if (value > 200) {
                errors.push("El número de unidades no puede ser mayor a 200.");
            } else {
                req.body.units = value;
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
function validateFireStationQuery(req, res, next) {
    const { search, status } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== "string") {
        errors.push("El parámetro search debe ser texto.");
    }

    if (status !== undefined && status !== "all" && !ALLOWED_FIRE_STATION_STATUSES.includes(status)) {
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
    validateFireStationPayload,
    validateFireStationQuery,
    ALLOWED_FIRE_STATION_STATUSES
};
