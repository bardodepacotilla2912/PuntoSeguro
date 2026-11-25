"use strict";

const mongoose = require("mongoose");

const HelpPointModel = require("../models/helpPoint.model");
const CategoryModel = require("../models/category.model");
const AppError = require("../utils/appError");

class HelpPointsService {

    async getAll(filters = {}) {
        const {
            search = "",
            category = "all",
            status = "all"
        } = filters;

        const query = {};

        if (category !== "all") {
            query.category = category;
        }

        if (status !== "all") {
            query.status = status;
        }

        // Búsqueda por nombre (texto parcial, sin importar mayúsculas)
        const text = search.trim();

        if (text) {
            query.name = this.buildSearchRegex(text);
        }

        // populate: en lugar del ObjectId regresa el nombre y color de la categoría
        return HelpPointModel.find(query)
            .populate("category", "name color")
            .sort({ createdAt: -1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró el punto de ayuda con ID ${id}`);
        }

        const point = await HelpPointModel.findById(id).populate("category", "name color");

        if (!point) {
            throw new AppError(404, `No se encontró el punto de ayuda con ID ${id}`);
        }

        return point;
    }

    async getGeoJSON(filters = {}) {
        const points = await this.getAll(filters);

        return {
            type: "FeatureCollection",
            features: points.map((point) => ({
                type: "Feature",
                properties: {
                    id: point.id,
                    name: point.name,
                    description: point.description,
                    category: point.category ? point.category.name : null,
                    status: point.status,
                    phone: point.phone,
                    schedule: point.schedule,
                    createdAt: point.createdAt,
                    updatedAt: point.updatedAt
                },
                geometry: point.location
            }))
        };
    }

    // Puntos activos ordenados del más cercano al más lejano ($near usa el índice 2dsphere)
    async getNearest(filters = {}) {
        const {
            lat,
            lng,
            category = "all"
        } = filters;

        const query = {
            status: "activo",
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)]
                    }
                }
            }
        };

        if (category !== "all") {
            query.category = category;
        }

        return HelpPointModel.find(query)
            .populate("category", "name color")
            .limit(5);
    }

    async create(data) {
        await this.checkCategory(data.category);

        const point = await HelpPointModel.create({
            name: data.name.trim(),
            description: data.description.trim(),
            category: data.category,
            status: data.status,
            phone: data.phone ? data.phone.trim() : "",
            schedule: data.schedule ? data.schedule.trim() : "",
            location: {
                type: "Point",
                coordinates: [
                    Number(data.longitude),
                    Number(data.latitude)
                ]
            }
        });

        return this.getById(point.id);
    }

    async update(id, changes) {
        const point = await this.getById(id);

        if (changes.category !== undefined) {
            await this.checkCategory(changes.category);
            point.category = changes.category;
        }

        ["name", "description", "status", "phone", "schedule"].forEach((field) => {
            if (changes[field] !== undefined) {
                point[field] = changes[field].trim();
            }
        });

        if (changes.latitude !== undefined || changes.longitude !== undefined) {
            const [currentLongitude, currentLatitude] = point.location.coordinates;

            point.location.coordinates = [
                changes.longitude !== undefined ? Number(changes.longitude) : currentLongitude,
                changes.latitude !== undefined ? Number(changes.latitude) : currentLatitude
            ];
        }

        await point.save();

        return this.getById(id);
    }

    async delete(id) {
        const point = await this.getById(id);

        await point.deleteOne();

        return point;
    }

    // La categoría debe existir en la colección categories
    async checkCategory(categoryId) {
        const category = await CategoryModel.findById(categoryId);

        if (!category) {
            throw new AppError(400, "La categoría seleccionada no existe.");
        }
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

module.exports = HelpPointsService;
