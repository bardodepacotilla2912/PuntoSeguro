"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions, pointSchemaDefinition } = require("./schema.options");
const { HELP_POINT_STATUSES } = require("../utils/constants");

// Punto de ayuda = ubicación exacta registrada desde el mapa
const helpPointSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        // Relación por referencia: punto -> categoría
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        status: {
            type: String,
            enum: HELP_POINT_STATUSES,
            default: "activo"
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: ""
        },
        schedule: {
            type: String,
            trim: true,
            maxlength: 60,
            default: ""
        },
        // GeoJSON Point: [longitud, latitud]
        location: {
            type: new mongoose.Schema(pointSchemaDefinition, { _id: false }),
            required: true
        },
        // Relación por referencia: punto -> usuario que lo registró
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    baseSchemaOptions
);

// Índice geoespacial para $near, $geoNear y $geoWithin
helpPointSchema.index({ location: "2dsphere" });

const HelpPointModel = mongoose.model("HelpPoint", helpPointSchema);

module.exports = HelpPointModel;
