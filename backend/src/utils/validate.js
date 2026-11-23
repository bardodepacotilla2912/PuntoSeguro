"use strict";

const mongoose = require("mongoose");
const AppError = require("./appError");

/*
 * Crea un middleware que valida req.body con base en un objeto de reglas.
 *
 * Ejemplo de reglas:
 * {
 *   name:  { type: "string", required: true, min: 3, max: 100, label: "nombre" },
 *   beds:  { type: "integer", min: 0, label: "camas" },
 *   type:  { type: "enum", values: ["a", "b"], required: true },
 *   helpPoint: { type: "objectId", nullable: true }
 * }
 *
 * partial = true  -> PATCH (todos los campos son opcionales, pero al menos uno)
 * partial = false -> POST  (se exigen los campos marcados como required)
 */
function createBodyValidator(rules, { partial = false } = {}) {
    const allowedFields = Object.keys(rules);

    return function bodyValidator(req, res, next) {
        const body = req.body || {};
        const errors = [];

        // 1.- Campos que no existen en las reglas
        const unknownFields = Object.keys(body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (unknownFields.length > 0) {
            errors.push(`Los siguientes campos no son permitidos: ${unknownFields.join(", ")}.`);
        }

        const providedFields = allowedFields.filter((field) => body[field] !== undefined);

        if (partial && providedFields.length === 0) {
            errors.push("Debes proporcionar al menos un campo para actualizar.");
        }

        // 2.- Revisar cada campo según su regla
        for (const field of allowedFields) {
            const rule = rules[field];
            const label = rule.label || field;
            const value = body[field];
            const isEmpty = value === undefined || value === null || value === "";

            if (isEmpty) {
                if (rule.nullable && value !== undefined) {
                    req.body[field] = null;
                    continue;
                }

                if (!partial && rule.required) {
                    errors.push(`El campo "${label}" es obligatorio.`);
                } else if (partial && value !== undefined && rule.required) {
                    errors.push(`El campo "${label}" no puede quedar vacío.`);
                }
                continue;
            }

            const error = checkValue(field, value, rule, label, req.body);

            if (error) {
                errors.push(error);
            }
        }

        if (errors.length > 0) {
            return next(new AppError(400, "La información enviada no es válida", errors));
        }

        next();
    };
}

// Valida un valor y, si aplica, lo convierte (ej. "12" -> 12)
function checkValue(field, value, rule, label, target) {
    switch (rule.type) {
        case "string": {
            if (typeof value !== "string") {
                return `El campo "${label}" debe ser texto.`;
            }
            const text = value.trim();
            if (rule.min && text.length < rule.min) {
                return `El campo "${label}" debe tener al menos ${rule.min} caracteres.`;
            }
            if (rule.max && text.length > rule.max) {
                return `El campo "${label}" no debe superar los ${rule.max} caracteres.`;
            }
            if (rule.pattern && !rule.pattern.test(text)) {
                return rule.patternMessage || `El campo "${label}" no tiene un formato válido.`;
            }
            target[field] = text;
            return null;
        }

        case "number":
        case "integer": {
            const number = Number(value);
            if (!Number.isFinite(number) || typeof value === "boolean") {
                return `El campo "${label}" debe ser numérico.`;
            }
            if (rule.type === "integer" && !Number.isInteger(number)) {
                return `El campo "${label}" debe ser un número entero.`;
            }
            if (rule.min !== undefined && number < rule.min) {
                return `El campo "${label}" debe ser mayor o igual a ${rule.min}.`;
            }
            if (rule.max !== undefined && number > rule.max) {
                return `El campo "${label}" debe ser menor o igual a ${rule.max}.`;
            }
            target[field] = number;
            return null;
        }

        case "boolean": {
            if (typeof value === "boolean") return null;
            if (value === "true" || value === "false") {
                target[field] = value === "true";
                return null;
            }
            return `El campo "${label}" debe ser verdadero o falso.`;
        }

        case "enum": {
            if (!rule.values.includes(value)) {
                return `El campo "${label}" debe ser uno de los siguientes: ${rule.values.join(", ")}.`;
            }
            return null;
        }

        case "objectId": {
            if (!mongoose.isValidObjectId(value)) {
                return `El campo "${label}" no es un identificador válido.`;
            }
            return null;
        }

        case "stringArray": {
            if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
                return `El campo "${label}" debe ser una lista de textos.`;
            }
            target[field] = value.map((item) => item.trim()).filter(Boolean);
            return null;
        }

        case "custom": {
            return rule.check(value, target);
        }

        default:
            return null;
    }
}

// Validación de coordenadas sueltas (latitud / longitud)
function isValidLatitude(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= -90 && number <= 90;
}

function isValidLongitude(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= -180 && number <= 180;
}

module.exports = {
    createBodyValidator,
    isValidLatitude,
    isValidLongitude
};
