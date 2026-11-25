"use strict";

const mongoose = require("mongoose");

// Categorías de los puntos de ayuda: Hospital, Bomberos, Policía y Farmacia
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        // Color con el que se pinta el punto en el mapa
        color: {
            type: String,
            required: true
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

const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
