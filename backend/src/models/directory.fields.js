"use strict";

const mongoose = require("mongoose");

// Campos que comparten las 4 entidades del directorio
// (hospitales, bomberos, policía y farmacias)
function directoryBaseFields(statuses) {
    return {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        status: {
            type: String,
            required: true,
            enum: statuses
        },
        // Relación por referencia: entrada del directorio -> punto en el mapa
        helpPoint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpPoint",
            default: null
        },
        // Relación por referencia: quién lo registró
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    };
}

module.exports = {
    directoryBaseFields
};
