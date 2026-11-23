"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");
const { directoryBaseFields } = require("./directory.fields");
const { POLICE_TYPES, POLICE_STATUSES } = require("../utils/constants");

const policeStationSchema = new mongoose.Schema(
    {
        ...directoryBaseFields(POLICE_STATUSES),
        type: {
            type: String,
            required: true,
            enum: POLICE_TYPES
        },
        sector: {
            type: String,
            trim: true,
            maxlength: 60,
            default: ""
        },
        officers: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    baseSchemaOptions
);

const PoliceStationModel = mongoose.model("PoliceStation", policeStationSchema);

module.exports = PoliceStationModel;
