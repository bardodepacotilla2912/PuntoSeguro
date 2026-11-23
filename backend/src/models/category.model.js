"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");
const { CATEGORY_SLUGS } = require("../utils/constants");

// Catálogo de categorías de los puntos de ayuda:
// Hospital, Bomberos, Policía y Farmacia
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            enum: CATEGORY_SLUGS
        },
        color: {
            type: String,
            required: true,
            default: "#2563eb"
        },
        icon: {
            type: String,
            default: "📍"
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        }
    },
    baseSchemaOptions
);

const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
