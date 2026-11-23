"use strict";

const mongoose = require("mongoose");
const { baseSchemaOptions } = require("./schema.options");
const { directoryBaseFields } = require("./directory.fields");
const { FIRE_STATION_STATUSES } = require("../utils/constants");

const fireStationSchema = new mongoose.Schema(
    {
        ...directoryBaseFields(FIRE_STATION_STATUSES),
        units: {
            type: Number,
            min: 0,
            default: 0
        },
        chief: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        }
    },
    baseSchemaOptions
);

const FireStationModel = mongoose.model("FireStation", fireStationSchema);

module.exports = FireStationModel;
