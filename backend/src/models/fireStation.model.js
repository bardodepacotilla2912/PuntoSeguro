"use strict";

const mongoose = require("mongoose");

const {
    ALLOWED_FIRE_STATION_STATUSES
} = require("../middlewares/fireStation.validator");

const fireStationSchema = new mongoose.Schema(
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
            enum: ALLOWED_FIRE_STATION_STATUSES
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
        units: {
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

const FireStationModel = mongoose.model("FireStation", fireStationSchema);

module.exports = FireStationModel;
