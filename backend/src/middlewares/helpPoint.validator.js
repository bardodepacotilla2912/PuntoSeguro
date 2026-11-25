"use strict";

const mongoose = require("mongoose");

const AppError = require("../utils/appError");

// Letras (con acentos), números, espacios y signos básicos . , ' ( ) # - /
const TEXT_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/;

// Al menos una letra (no se acepta solo números o solo signos)
const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;

// 10 dígitos; se permiten espacios y guiones entre ellos
const PHONE_PATTERN = /^[0-9 -]+$/;

// "24 horas" o "HH:MM - HH:MM" con horas de 00 a 23 y minutos de 00 a 59
const SCHEDULE_PATTERN = /^(24 horas|([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d)$/i;

const ALLOWED_HELP_POINT_STATUSES = [
    "activo",
    "inactivo"
];

const ALLOWED_FIELDS = [
    "name",
    "description",
    "category",
    "status",
    "phone",
    "schedule",
    "latitude",
    "longitude"
];

// Campos que se piden al crear (teléfono y horario son opcionales)
const REQUIRED_FIELDS = [
    "name",
    "description",
    "category",
    "status",
    "latitude",
    "longitude"
];

// Validación del body (POST completo / PATCH parcial)
function validateHelpPointPayload(options = {}) {
    const { partial = false } = options;

    return function helpPointPayloadValidator(req, res, next) {
        const errors = [];
        const body = req.body || {};

        const providedFields = ALLOWED_FIELDS.filter(
            (field) => body[field] !== undefined
        );

        if (partial && providedFields.length === 0) {
            errors.push("Debes proporcionar al menos un campo para actualizar.");
        }

        if (!partial) {
            REQUIRED_FIELDS.forEach((field) => {
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
            if (typeof body.name !== "string" || body.name.trim().length < 3) {
                errors.push("El nombre debe contener al menos 3 caracteres.");
            } else if (body.name.trim().length > 100) {
                errors.push("El nombre no debe superar los 100 caracteres.");
            } else if (!TEXT_PATTERN.test(body.name.trim()) || !LETTER_PATTERN.test(body.name)) {
                errors.push("El nombre debe tener letras y no puede llevar símbolos especiales.");
            }
        }

        // Descripción
        if (body.description !== undefined) {
            if (typeof body.description !== "string" || body.description.trim().length < 5) {
                errors.push("La descripción debe contener al menos 5 caracteres.");
            } else if (body.description.trim().length > 250) {
                errors.push("La descripción no debe superar los 250 caracteres.");
            } else if (!LETTER_PATTERN.test(body.description)) {
                errors.push("La descripción debe contener letras.");
            }
        }

        // Categoría (ObjectId de la colección categories)
        if (body.category !== undefined && !mongoose.isValidObjectId(body.category)) {
            errors.push("La categoría no es válida.");
        }

        // Estado
        if (body.status !== undefined && !ALLOWED_HELP_POINT_STATUSES.includes(body.status)) {
            errors.push(
                `El estado debe ser uno de los siguientes: ${ALLOWED_HELP_POINT_STATUSES.join(", ")}.`
            );
        }

        // Teléfono (opcional): solo números (con espacios o guiones) y 10 dígitos
        if (body.phone !== undefined && body.phone !== "") {
            if (
                typeof body.phone !== "string" ||
                !PHONE_PATTERN.test(body.phone.trim()) ||
                body.phone.replace(/[ -]/g, "").length !== 10
            ) {
                errors.push("El teléfono debe tener 10 dígitos (solo números, espacios o guiones).");
            }
        }

        // Horario (opcional): "24 horas" o "HH:MM - HH:MM"
        if (body.schedule !== undefined && body.schedule !== "") {
            if (typeof body.schedule !== "string" || !SCHEDULE_PATTERN.test(body.schedule.trim())) {
                errors.push('El horario debe ser "24 horas" o tener el formato HH:MM - HH:MM (ej. 08:00 - 22:00).');
            }
        }

        // Latitud
        if (body.latitude !== undefined) {
            const latitude = Number(body.latitude);

            if (!Number.isFinite(latitude)) {
                errors.push("La latitud debe ser numérica.");
            } else if (latitude < -90 || latitude > 90) {
                errors.push("La latitud debe estar entre -90 y 90.");
            } else {
                req.body.latitude = latitude;
            }
        }

        // Longitud
        if (body.longitude !== undefined) {
            const longitude = Number(body.longitude);

            if (!Number.isFinite(longitude)) {
                errors.push("La longitud debe ser numérica.");
            } else if (longitude < -180 || longitude > 180) {
                errors.push("La longitud debe estar entre -180 y 180.");
            } else {
                req.body.longitude = longitude;
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

// Validación de los filtros (query string): ?search=&category=&status=
function validateHelpPointQuery(req, res, next) {
    const { search, category, status } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== "string") {
        errors.push("El parámetro search debe ser texto.");
    }

    if (category !== undefined && category !== "all" && !mongoose.isValidObjectId(category)) {
        errors.push("La categoría de filtrado no es válida.");
    }

    if (status !== undefined && status !== "all" && !ALLOWED_HELP_POINT_STATUSES.includes(status)) {
        errors.push("El estado de filtrado no es válido.");
    }

    if (errors.length > 0) {
        return next(
            new AppError(400, "Los parámetros de consulta no son válidos", errors)
        );
    }

    next();
}

// Validación de la búsqueda del más cercano: ?lat=&lng=&category=
function validateNearestQuery(req, res, next) {
    const { lat, lng, category } = req.query;
    const errors = [];

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (lat === undefined || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        errors.push("El parámetro lat es obligatorio y debe estar entre -90 y 90.");
    }

    if (lng === undefined || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        errors.push("El parámetro lng es obligatorio y debe estar entre -180 y 180.");
    }

    if (category !== undefined && category !== "all" && !mongoose.isValidObjectId(category)) {
        errors.push("La categoría de filtrado no es válida.");
    }

    if (errors.length > 0) {
        return next(
            new AppError(400, "Los parámetros de consulta no son válidos", errors)
        );
    }

    next();
}

module.exports = {
    validateHelpPointPayload,
    validateHelpPointQuery,
    validateNearestQuery,
    ALLOWED_HELP_POINT_STATUSES
};
