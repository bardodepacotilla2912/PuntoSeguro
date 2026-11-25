"use strict";

const mongoose = require("mongoose");

const FireStationModel = require("../models/fireStation.model");
const AppError = require("../utils/appError");

class FireStationsService {

    async getAll(filters = {}) {
        const {
            search = "",
            status = "all"
        } = filters;

        const query = {};

        if (status !== "all") {
            query.status = status;
        }

        const text = search.trim();

        if (text) {
            const regex = this.buildSearchRegex(text);

            query.$or = [
                { name: regex },
                { address: regex }
            ];
        }

        return FireStationModel.find(query).sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró la estación de bomberos con ID ${id}`);
        }

        const station = await FireStationModel.findById(id);

        if (!station) {
            throw new AppError(404, `No se encontró la estación de bomberos con ID ${id}`);
        }

        return station;
    }

    async create(data) {
        return FireStationModel.create({
            name: data.name.trim(),
            status: data.status.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            units: Number(data.units)
        });
    }

    async update(id, changes) {
        const station = await this.getById(id);

        ["name", "status", "phone", "address"].forEach((field) => {
            if (changes[field] !== undefined) {
                station[field] = changes[field].trim();
            }
        });

        if (changes.units !== undefined) {
            station.units = Number(changes.units);
        }

        await station.save();

        return station;
    }

    async delete(id) {
        const station = await this.getById(id);

        await station.deleteOne();

        return station;
    }

    // Construye una expresión regular que ignora mayúsculas y acentos
    buildSearchRegex(text) {
        const accents = { a: "[aá]", e: "[eé]", i: "[ií]", o: "[oó]", u: "[uúü]", n: "[nñ]" };

        const pattern = this.escapeRegex(
            text.normalize("NFD").replace(/[̀-ͯ]/g, "")
        ).replace(/[aeioun]/gi, (letter) => accents[letter.toLowerCase()]);

        return new RegExp(pattern, "i");
    }

    escapeRegex(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
}

module.exports = FireStationsService;
