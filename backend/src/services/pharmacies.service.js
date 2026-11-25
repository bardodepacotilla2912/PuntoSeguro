"use strict";

const mongoose = require("mongoose");

const PharmacyModel = require("../models/pharmacy.model");
const AppError = require("../utils/appError");

class PharmaciesService {

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

        return PharmacyModel.find(query).sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró la farmacia con ID ${id}`);
        }

        const pharmacy = await PharmacyModel.findById(id);

        if (!pharmacy) {
            throw new AppError(404, `No se encontró la farmacia con ID ${id}`);
        }

        return pharmacy;
    }

    async create(data) {
        return PharmacyModel.create({
            name: data.name.trim(),
            status: data.status.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            schedule: data.schedule.trim()
        });
    }

    async update(id, changes) {
        const pharmacy = await this.getById(id);

        ["name", "status", "phone", "address", "schedule"].forEach((field) => {
            if (changes[field] !== undefined) {
                pharmacy[field] = changes[field].trim();
            }
        });

        await pharmacy.save();

        return pharmacy;
    }

    async delete(id) {
        const pharmacy = await this.getById(id);

        await pharmacy.deleteOne();

        return pharmacy;
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

module.exports = PharmaciesService;
