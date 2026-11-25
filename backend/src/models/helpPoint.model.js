"use strict";

const mongoose = require("mongoose");

const {
    ALLOWED_HELP_POINT_STATUSES
} = require("../middlewares/helpPoint.validator");

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
            maxlength: 250
        },
        // Relación por referencia: punto de ayuda -> categoría
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ALLOWED_HELP_POINT_STATUSES
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        schedule: {
            type: String,
            trim: true,
            default: ""
        },

        // Ubicación en formato GeoJSON: [longitud, latitud]
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number],
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

helpPointSchema.index({ location: "2dsphere" });

const HelpPointModel = mongoose.model("HelpPoint", helpPointSchema);

module.exports = HelpPointModel;
