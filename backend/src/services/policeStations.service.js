"use strict";

const mongoose = require("mongoose");

const PoliceStationModel = require("../models/policeStation.model");
const AppError = require("../utils/appError");

class PoliceStationsService {

    async getAll(filters = {}) {
        const {
            search = "",
            type = "all",
            status = "all"
        } = filters;

        const query = {};

        if (type !== "all") {
            query.type = type;
        }

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

        return PoliceStationModel.find(query).sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró el módulo de policía con ID ${id}`);
        }

        const station = await PoliceStationModel.findById(id);

        if (!station) {
            throw new AppError(404, `No se encontró el módulo de policía con ID ${id}`);
        }

        return station;
    }

    async create(data) {
        return PoliceStationModel.create({
            name: data.name.trim(),
            type: data.type.trim(),
            status: data.status.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            officers: Number(data.officers)
        });
    }

    async update(id, changes) {
        const station = await this.getById(id);

        ["name", "type", "status", "phone", "address"].forEach((field) => {
            if (changes[field] !== undefined) {
                station[field] = changes[field].trim();
            }
        });

        if (changes.officers !== undefined) {
            station.officers = Number(changes.officers);
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

module.exports = PoliceStationsService;
