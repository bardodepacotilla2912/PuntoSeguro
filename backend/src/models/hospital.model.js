"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");
const { directoryBaseFields } = require("./directory.fields");
const { HOSPITAL_TYPES, HOSPITAL_STATUSES } = require("../utils/constants");

const hospitalSchema = new mongoose.Schema(
    {
        ...directoryBaseFields(HOSPITAL_STATUSES),
        type: {
            type: String,
            required: true,
            enum: HOSPITAL_TYPES
        },
        emergencyPhone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: ""
        },
        beds: {
            type: Number,
            min: 0,
            default: 0
        },
        specialties: {
            type: [String],
            default: []
        },
        is24h: {
            type: Boolean,
            default: true
        }
    },
    baseSchemaOptions
);

const HospitalModel = mongoose.model("Hospital", hospitalSchema);

module.exports = HospitalModel;
