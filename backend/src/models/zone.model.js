"use strict";

const mongoose = require("mongoose");

// Zona dibujada en el mapa
const zoneSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        // Área en formato GeoJSON Polygon: [[[longitud, latitud], ...]]
        area: {
            type: {
                type: String,
                enum: ["Polygon"],
                default: "Polygon"
            },
            coordinates: {
                type: [[[Number]]],
                required: true
            }
        }
    },
    {
        timestamps: true,

        toJSON: {
            versionKey: false,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                return ret;
            }
        }
    }
);

zoneSchema.index({ area: "2dsphere" });

const ZoneModel = mongoose.model("Zone", zoneSchema);

module.exports = ZoneModel;
