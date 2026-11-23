"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 120
        },
        // Se guarda cifrada con bcrypt. select:false evita que salga en las consultas
        password: {
            type: String,
            required: true,
            select: false
        }
    },
    {
        ...baseSchemaOptions,
        toJSON: {
            versionKey: false,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.password;
                return ret;
            }
        }
    }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
