"use strict";

const AppError = require("../utils/appError");

const ALLOWED_FIELDS = [
    "name",
    "coordinates"
];

// Validación del body al guardar una zona
// coordinates = [[[longitud, latitud], [longitud, latitud], ...]] (GeoJSON Polygon)
function validateZonePayload(req, res, next) {
    const errors = [];
    const body = req.body || {};

    // Nombre
    if (typeof body.name !== "string" || body.name.trim().length < 3) {
        errors.push("El nombre de la zona debe contener al menos 3 caracteres.");
    } else if (body.name.trim().length > 80) {
        errors.push("El nombre de la zona no debe superar los 80 caracteres.");
    } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'()#\/-]+$/.test(body.name.trim()) || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(body.name)) {
        errors.push("El nombre de la zona debe tener letras y no puede llevar símbolos especiales.");
    }

    // Coordenadas del polígono
    const coordinates = body.coordinates;

    if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
        errors.push("Las coordenadas del polígono no son válidas.");
    } else {
        const ring = coordinates[0];

        // 3 vértices + el vértice de cierre (igual al primero)
        if (ring.length < 4) {
            errors.push("El polígono debe tener al menos 3 vértices.");
        }

        const invalidVertex = ring.some((vertex) => {
            if (!Array.isArray(vertex) || vertex.length !== 2) {
                return true;
            }

            const [longitude, latitude] = vertex;

            return (
                !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
                !Number.isFinite(latitude) || latitude < -90 || latitude > 90
            );
        });

        if (invalidVertex) {
            errors.push("Cada vértice debe tener la forma [longitud, latitud] con valores válidos.");
        } else {
            // GeoJSON exige que el polígono cierre: el último vértice es igual al primero
            const first = ring[0];
            const last = ring[ring.length - 1];

            if (first[0] !== last[0] || first[1] !== last[1]) {
                errors.push("El polígono debe cerrarse: el último vértice debe ser igual al primero.");
            }
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
}

module.exports = {
    validateZonePayload
};
