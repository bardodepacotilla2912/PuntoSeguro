"use strict";

const { createBodyValidator, isValidLatitude, isValidLongitude } = require("../utils/validate");

// Revisa que coordinates sea un Polygon GeoJSON: [[[lng, lat], [lng, lat], ...]]
// Si el anillo no viene cerrado, se cierra repitiendo el primer vértice.
function checkPolygon(value, body) {
    if (!Array.isArray(value) || value.length === 0) {
        return "Las coordenadas del polígono deben ser una lista de anillos.";
    }

    const rings = [];

    for (const ring of value) {
        if (!Array.isArray(ring)) {
            return "Cada anillo del polígono debe ser una lista de vértices.";
        }

        const vertices = [];

        for (const vertex of ring) {
            if (!Array.isArray(vertex) || vertex.length !== 2) {
                return "Cada vértice debe tener la forma [longitud, latitud].";
            }

            const [lng, lat] = vertex;

            if (!isValidLongitude(lng) || !isValidLatitude(lat)) {
                return "Algún vértice tiene una longitud o latitud fuera de rango.";
            }

            vertices.push([Number(lng), Number(lat)]);
        }

        const first = vertices[0];
        const last = vertices[vertices.length - 1];

        if (first && (first[0] !== last[0] || first[1] !== last[1])) {
            vertices.push([...first]);
        }

        // Un polígono cerrado necesita al menos 3 vértices distintos + el de cierre
        if (vertices.length < 4) {
            return "El polígono debe tener al menos 3 vértices.";
        }

        rings.push(vertices);
    }

    body.coordinates = rings;
    return null;
}

const zoneRules = {
    name: { type: "string", required: true, min: 3, max: 80, label: "nombre" },
    description: { type: "string", max: 200, label: "descripción" },
    color: {
        type: "string",
        pattern: /^#[0-9a-fA-F]{6}$/,
        patternMessage: "El color debe tener formato hexadecimal, por ejemplo #7c3aed.",
        label: "color"
    },
    coordinates: { type: "custom", required: true, label: "coordenadas", check: checkPolygon }
};

function validateZonePayload({ partial = false } = {}) {
    return createBodyValidator(zoneRules, { partial });
}

module.exports = {
    validateZonePayload
};
