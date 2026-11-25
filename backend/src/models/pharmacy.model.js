"use strict";

const mongoose = require("mongoose");

const {
    ALLOWED_PHARMACY_STATUSES
} = require("../middlewares/pharmacy.validator");

const pharmacySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        status: {
            type: String,
            required: true,
            enum: ALLOWED_PHARMACY_STATUSES
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        schedule: {
            type: String,
            required: true,
            trim: true
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

const PharmacyModel = mongoose.model("Pharmacy", pharmacySchema);

module.exports = PharmacyModel;
