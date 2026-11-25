"use strict";

const mongoose = require("mongoose");

const {
    ALLOWED_POLICE_TYPES,
    ALLOWED_POLICE_STATUSES
} = require("../middlewares/policeStation.validator");

const policeStationSchema = new mongoose.Schema(
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
            enum: ALLOWED_POLICE_TYPES
        },
        status: {
            type: String,
            required: true,
            enum: ALLOWED_POLICE_STATUSES
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
        officers: {
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

const PoliceStationModel = mongoose.model("PoliceStation", policeStationSchema);

module.exports = PoliceStationModel;
