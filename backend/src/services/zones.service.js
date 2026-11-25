"use strict";

const mongoose = require("mongoose");

const ZoneModel = require("../models/zone.model");
const AppError = require("../utils/appError");

class ZonesService {

    async getAll() {
        return ZoneModel.find().sort({ createdAt: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró la zona con ID ${id}`);
        }

        const zone = await ZoneModel.findById(id);

        if (!zone) {
            throw new AppError(404, `No se encontró la zona con ID ${id}`);
        }

        return zone;
    }

    async create(data) {
        return ZoneModel.create({
            name: data.name.trim(),
            area: {
                type: "Polygon",
                coordinates: data.coordinates
            }
        });
    }

    async delete(id) {
        const zone = await this.getById(id);

        await zone.deleteOne();

        return zone;
    }
}

module.exports = ZonesService;
