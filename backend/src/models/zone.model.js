"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");

// Zona dibujada en el mapa (polígono)
const zoneSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },
        color: {
            type: String,
            default: "#7c3aed"
        },
        // GeoJSON Polygon: [[[longitud, latitud], ...]] (el anillo cierra en el primer punto)
        area: {
            type: {
                type: String,
                enum: ["Polygon"],
                default: "Polygon",
                required: true
            },
            coordinates: {
                type: [[[Number]]],
                required: true
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    baseSchemaOptions
);

zoneSchema.index({ area: "2dsphere" });

const ZoneModel = mongoose.model("Zone", zoneSchema);

module.exports = ZoneModel;
