"use strict";

const mongoose = require("mongoose");

const AppError = require("../utils/appError");
const { createBodyValidator, isValidLatitude, isValidLongitude } = require("../utils/validate");
const { HELP_POINT_STATUSES } = require("../utils/constants");

const helpPointRules = {
    name: { type: "string", required: true, min: 3, max: 100, label: "nombre" },
    description: { type: "string", required: true, min: 5, max: 300, label: "descripción" },
    category: { type: "objectId", required: true, label: "categoría" },
    status: { type: "enum", values: HELP_POINT_STATUSES, label: "estado" },
    phone: {
        type: "string",
        max: 30,
        pattern: /^[0-9+\-\s()]{3,30}$/,
        patternMessage: "El teléfono solo puede contener números, espacios, +, - y paréntesis.",
        label: "teléfono"
    },
    schedule: { type: "string", max: 60, label: "horario" },
    latitude: {
        type: "custom",
        required: true,
        label: "latitud",
        check(value, body) {
            if (!isValidLatitude(value)) return "La latitud debe ser un número entre -90 y 90.";
            body.latitude = Number(value);
            return null;
        }
    },
    longitude: {
        type: "custom",
        required: true,
        label: "longitud",
        check(value, body) {
            if (!isValidLongitude(value)) return "La longitud debe ser un número entre -180 y 180.";
            body.longitude = Number(value);
            return null;
        }
    }
};

function validateHelpPointPayload({ partial = false } = {}) {
    return createBodyValidator(helpPointRules, { partial });
}

// Filtros: ?search=&category=&status=&zone=
function validateHelpPointQuery(req, res, next) {
    const { search, category, status, zone } = req.query;
    const errors = [];

    if (search !== undefined && typeof search !== "string") {
        errors.push("El parámetro search debe ser texto.");
    }

    if (category !== undefined && category !== "all" && !mongoose.isValidObjectId(category)) {
        errors.push("El parámetro category no es un identificador válido.");
    }

    if (status !== undefined && status !== "all" && !HELP_POINT_STATUSES.includes(status)) {
        errors.push(`El parámetro status debe ser: all, ${HELP_POINT_STATUSES.join(", ")}.`);
    }

    if (zone !== undefined && zone !== "all" && !mongoose.isValidObjectId(zone)) {
        errors.push("El parámetro zone no es un identificador válido.");
    }

    if (errors.length > 0) {
        return next(new AppError(400, "Los parámetros de consulta no son válidos", errors));
    }

    next();
}

// Búsqueda del más cercano: ?lat=&lng=&category=&limit=&maxDistance=
function validateNearestQuery(req, res, next) {
    const { lat, lng, category, limit, maxDistance } = req.query;
    const errors = [];

    if (!isValidLatitude(lat)) {
        errors.push("El parámetro lat es obligatorio y debe estar entre -90 y 90.");
    }

    if (!isValidLongitude(lng)) {
        errors.push("El parámetro lng es obligatorio y debe estar entre -180 y 180.");
    }

    if (category !== undefined && category !== "all" && !mongoose.isValidObjectId(category)) {
        errors.push("El parámetro category no es un identificador válido.");
    }

    if (limit !== undefined) {
        const value = Number(limit);
        if (!Number.isInteger(value) || value < 1 || value > 20) {
            errors.push("El parámetro limit debe ser un entero entre 1 y 20.");
        }
    }

    if (maxDistance !== undefined) {
        const value = Number(maxDistance);
        if (!Number.isFinite(value) || value <= 0 || value > 100) {
            errors.push("El parámetro maxDistance (km) debe estar entre 0 y 100.");
        }
    }

    if (errors.length > 0) {
        return next(new AppError(400, "Los parámetros de consulta no son válidos", errors));
    }

    next();
}

module.exports = {
    validateHelpPointPayload,
    validateHelpPointQuery,
    validateNearestQuery
};
