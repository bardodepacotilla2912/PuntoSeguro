"use strict";

// Opciones comunes para todos los esquemas:
// - timestamps agrega createdAt y updatedAt
// - toJSON cambia _id por id y quita __v
const baseSchemaOptions = {
    timestamps: true,
    toJSON: {
        versionKey: false,
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            return ret;
        }
    }
};

// Sub-esquema GeoJSON Point. Siempre [longitud, latitud]
const pointSchemaDefinition = {
    type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator(value) {
                return (
                    Array.isArray(value) &&
                    value.length === 2 &&
                    value[0] >= -180 && value[0] <= 180 &&
                    value[1] >= -90 && value[1] <= 90
                );
            },
            message: "Las coordenadas deben ser [longitud, latitud]."
        }
    }
};

module.exports = {
    baseSchemaOptions,
    pointSchemaDefinition
};
