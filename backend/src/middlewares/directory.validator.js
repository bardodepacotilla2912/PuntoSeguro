"use strict";

const AppError = require("../utils/appError");
const { createBodyValidator } = require("../utils/validate");
const {
    HOSPITAL_TYPES,
    HOSPITAL_STATUSES,
    FIRE_STATION_STATUSES,
    POLICE_TYPES,
    POLICE_STATUSES,
    PHARMACY_STATUSES
} = require("../utils/constants");

const PHONE_RULE = {
    type: "string",
    max: 30,
    pattern: /^[0-9+\-\s()]{3,30}$/,
    patternMessage: "El teléfono solo puede contener números, espacios, +, - y paréntesis.",
    label: "teléfono"
};

// Reglas comunes a las 4 entidades del directorio
function baseRules(statuses) {
    return {
        name: { type: "string", required: true, min: 3, max: 100, label: "nombre" },
        phone: { ...PHONE_RULE, required: true },
        address: { type: "string", required: true, min: 5, max: 200, label: "dirección" },
        status: { type: "enum", values: statuses, required: true, label: "estado" },
        helpPoint: { type: "objectId", nullable: true, label: "punto en el mapa" }
    };
}

const hospitalRules = {
    ...baseRules(HOSPITAL_STATUSES),
    type: { type: "enum", values: HOSPITAL_TYPES, required: true, label: "tipo" },
    emergencyPhone: { ...PHONE_RULE, label: "teléfono de urgencias" },
    beds: { type: "integer", min: 0, max: 5000, label: "camas" },
    specialties: { type: "stringArray", label: "especialidades" },
    is24h: { type: "boolean", label: "24 horas" }
};

const fireStationRules = {
    ...baseRules(FIRE_STATION_STATUSES),
    units: { type: "integer", min: 0, max: 500, label: "unidades" },
    chief: { type: "string", max: 100, label: "responsable" }
};

const policeStationRules = {
    ...baseRules(POLICE_STATUSES),
    type: { type: "enum", values: POLICE_TYPES, required: true, label: "tipo" },
    sector: { type: "string", max: 60, label: "sector" },
    officers: { type: "integer", min: 0, max: 5000, label: "elementos" }
};

const pharmacyRules = {
    ...baseRules(PHARMACY_STATUSES),
    chain: { type: "string", max: 60, label: "cadena" },
    is24h: { type: "boolean", label: "24 horas" },
    delivery: { type: "boolean", label: "servicio a domicilio" }
};

function buildPayloadValidator(rules) {
    return ({ partial = false } = {}) => createBodyValidator(rules, { partial });
}

// Filtros del directorio: ?search=&status=
function buildQueryValidator(statuses) {
    return function directoryQueryValidator(req, res, next) {
        const { search, status } = req.query;
        const errors = [];

        if (search !== undefined && typeof search !== "string") {
            errors.push("El parámetro search debe ser texto.");
        }

        if (status !== undefined && status !== "all" && !statuses.includes(status)) {
            errors.push(`El parámetro status debe ser: all, ${statuses.join(", ")}.`);
        }

        if (errors.length > 0) {
            return next(new AppError(400, "Los parámetros de consulta no son válidos", errors));
        }

        next();
    };
}

module.exports = {
    validateHospitalPayload: buildPayloadValidator(hospitalRules),
    validateHospitalQuery: buildQueryValidator(HOSPITAL_STATUSES),

    validateFireStationPayload: buildPayloadValidator(fireStationRules),
    validateFireStationQuery: buildQueryValidator(FIRE_STATION_STATUSES),

    validatePoliceStationPayload: buildPayloadValidator(policeStationRules),
    validatePoliceStationQuery: buildQueryValidator(POLICE_STATUSES),

    validatePharmacyPayload: buildPayloadValidator(pharmacyRules),
    validatePharmacyQuery: buildQueryValidator(PHARMACY_STATUSES)
};
