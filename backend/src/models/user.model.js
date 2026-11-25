"use strict";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        // unique: no se permiten dos cuentas con el mismo correo
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        // Se guarda cifrada con bcrypt, nunca en texto plano
        password: {
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
                // La contraseña nunca se regresa en las respuestas
                delete ret.password;
                return ret;
            }
        }
    }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
