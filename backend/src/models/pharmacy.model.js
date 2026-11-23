"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");
const { directoryBaseFields } = require("./directory.fields");
const { PHARMACY_STATUSES } = require("../utils/constants");

const pharmacySchema = new mongoose.Schema(
    {
        ...directoryBaseFields(PHARMACY_STATUSES),
        chain: {
            type: String,
            trim: true,
            maxlength: 60,
            default: ""
        },
        is24h: {
            type: Boolean,
            default: false
        },
        delivery: {
            type: Boolean,
            default: false
        }
    },
    baseSchemaOptions
);

const PharmacyModel = mongoose.model("Pharmacy", pharmacySchema);

module.exports = PharmacyModel;
