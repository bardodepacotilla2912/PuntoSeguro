"use strict";

const mongoose = require("mongoose");

const HospitalModel = require("../models/hospital.model");
const AppError = require("../utils/appError");

class HospitalsService {

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

        return HospitalModel.find(query).sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró el hospital con ID ${id}`);
        }

        const hospital = await HospitalModel.findById(id);

        if (!hospital) {
            throw new AppError(404, `No se encontró el hospital con ID ${id}`);
        }

        return hospital;
    }

    async create(data) {
        return HospitalModel.create({
            name: data.name.trim(),
            type: data.type.trim(),
            status: data.status.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            beds: Number(data.beds)
        });
    }

    async update(id, changes) {
        const hospital = await this.getById(id);

        ["name", "type", "status", "phone", "address"].forEach((field) => {
            if (changes[field] !== undefined) {
                hospital[field] = changes[field].trim();
            }
        });

        if (changes.beds !== undefined) {
            hospital.beds = Number(changes.beds);
        }

        await hospital.save();

        return hospital;
    }

    async delete(id) {
        const hospital = await this.getById(id);

        await hospital.deleteOne();

        return hospital;
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

module.exports = HospitalsService;
