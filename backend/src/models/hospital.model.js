"use strict";

const mongoose = require("mongoose");

const {
    ALLOWED_HOSPITAL_TYPES,
    ALLOWED_HOSPITAL_STATUSES
} = require("../middlewares/hospital.validator");

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        type: {
            type: String,
            required: true,
            enum: ALLOWED_HOSPITAL_TYPES
        },
        status: {
            type: String,
            required: true,
            enum: ALLOWED_HOSPITAL_STATUSES
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
        beds: {
            type: Number,
            required: true,
            min: 0
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

const HospitalModel = mongoose.model("Hospital", hospitalSchema);

module.exports = HospitalModel;
