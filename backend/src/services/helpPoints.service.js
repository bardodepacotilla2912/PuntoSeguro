"use strict";

const mongoose = require("mongoose");

const HelpPointModel = require("../models/helpPoint.model");
const CategoryModel = require("../models/category.model");
const ZoneModel = require("../models/zone.model");
const HospitalModel = require("../models/hospital.model");
const FireStationModel = require("../models/fireStation.model");
const PoliceStationModel = require("../models/policeStation.model");
const PharmacyModel = require("../models/pharmacy.model");
const AppError = require("../utils/appError");
const { buildSearchRegex } = require("../utils/search");

// populate: en lugar del ObjectId se regresa el documento relacionado
const POPULATE = [
    { path: "category", select: "name slug color icon" },
    { path: "createdBy", select: "name email" }
];

// Colecciones del directorio que pueden apuntar a un punto de ayuda
const DIRECTORY_MODELS = [HospitalModel, FireStationModel, PoliceStationModel, PharmacyModel];

class HelpPointsService {

    // Filtros resueltos en MongoDB: ?search=&category=&status=&zone=
    async buildQuery(filters = {}) {
        const { search = "", category = "all", status = "all", zone = "all" } = filters;
        const query = {};

        // 1.- Búsqueda por nombre (texto parcial, sin importar mayúsculas)
        const text = String(search).trim();
        if (text) {
            query.name = buildSearchRegex(text);
        }

        // 2.- Filtro por categoría
        if (category && category !== "all") {
            query.category = category;
        }

        // 3.- Filtro por estado
        if (status && status !== "all") {
            query.status = status;
        }

        // 4.- Filtro por zona: puntos dentro del polígono ($geoWithin)
        if (zone && zone !== "all") {
            const zoneDoc = await ZoneModel.findById(zone);

            if (!zoneDoc) {
                throw new AppError(404, `No se encontró la zona con ID ${zone}`);
            }

            query.location = {
                $geoWithin: {
                    $geometry: {
                        type: "Polygon",
                        coordinates: zoneDoc.area.coordinates
                    }
                }
            };
        }

        return query;
    }

    async getAll(filters = {}) {
        const query = await this.buildQuery(filters);

        return HelpPointModel.find(query)
            .populate(POPULATE)
            .sort({ createdAt: -1 });
    }

    async getGeoJSON(filters = {}) {
        const points = await this.getAll(filters);

        return {
            type: "FeatureCollection",
            features: points.map((point) => {
                const json = point.toJSON();
                const { location, ...properties } = json;

                return {
                    type: "Feature",
                    properties,
                    geometry: location
                };
            })
        };
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró el punto de ayuda con ID ${id}`);
        }

        const point = await HelpPointModel.findById(id).populate(POPULATE);

        if (!point) {
            throw new AppError(404, `No se encontró el punto de ayuda con ID ${id}`);
        }

        return point;
    }

    // Puntos más cercanos a una coordenada usando $geoNear (índice 2dsphere)
    async getNearest({ lat, lng, category = "all", limit = 5, maxDistance = 20 }) {
        const query = { status: "activo" };

        if (category && category !== "all") {
            query.category = new mongoose.Types.ObjectId(String(category));
        }

        const results = await HelpPointModel.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    distanceField: "distance",          // en metros
                    maxDistance: Number(maxDistance) * 1000,
                    spherical: true,
                    query
                }
            },
            { $limit: Number(limit) },
            { $project: { _id: 1, distance: 1 } }
        ]);

        if (results.length === 0) {
            return [];
        }

        // Se consultan los documentos completos (con populate) y se conserva el orden por distancia
        const ids = results.map((item) => item._id);
        const points = await HelpPointModel.find({ _id: { $in: ids } }).populate(POPULATE);
        const byId = new Map(points.map((point) => [point.id, point]));

        // Contacto del directorio vinculado (si existe)
        const contacts = await this.getDirectoryContacts(ids);

        return results
            .filter((item) => byId.has(item._id.toString()))
            .map((item) => ({
                ...byId.get(item._id.toString()).toJSON(),
                distance: Math.round(item.distance),
                directory: contacts.get(item._id.toString()) || null
            }));
    }

    // Busca en el directorio las entradas vinculadas a los puntos
    async getDirectoryContacts(pointIds) {
        const contacts = new Map();

        const groups = await Promise.all(
            DIRECTORY_MODELS.map((model) =>
                model.find({ helpPoint: { $in: pointIds } })
                    .select("name phone address status emergencyPhone helpPoint")
                    .lean()
            )
        );

        groups.flat().forEach((entry) => {
            contacts.set(entry.helpPoint.toString(), {
                name: entry.name,
                phone: entry.phone,
                emergencyPhone: entry.emergencyPhone || "",
                address: entry.address,
                status: entry.status
            });
        });

        return contacts;
    }

    async ensureCategory(categoryId) {
        const exists = await CategoryModel.exists({ _id: categoryId });

        if (!exists) {
            throw new AppError(400, "La categoría seleccionada no existe.");
        }
    }

    async create(data, userId) {
        await this.ensureCategory(data.category);

        const point = await HelpPointModel.create({
            name: data.name,
            description: data.description,
            category: data.category,
            status: data.status || "activo",
            phone: data.phone || "",
            schedule: data.schedule || "",
            location: {
                type: "Point",
                coordinates: [Number(data.longitude), Number(data.latitude)]
            },
            createdBy: userId
        });

        return this.getById(point.id);
    }

    async update(id, changes) {
        const point = await this.getById(id);

        if (changes.category !== undefined) {
            await this.ensureCategory(changes.category);
            point.category = changes.category;
        }

        ["name", "description", "status", "phone", "schedule"].forEach((field) => {
            if (changes[field] !== undefined) {
                point[field] = changes[field] ?? "";
            }
        });

        if (changes.latitude !== undefined || changes.longitude !== undefined) {
            const [currentLng, currentLat] = point.location.coordinates;

            point.location = {
                type: "Point",
                coordinates: [
                    changes.longitude !== undefined ? Number(changes.longitude) : currentLng,
                    changes.latitude !== undefined ? Number(changes.latitude) : currentLat
                ]
            };
        }

        await point.save();

        return this.getById(id);
    }

    async delete(id) {
        const point = await this.getById(id);

        await point.deleteOne();

        // Las entradas del directorio que apuntaban a este punto quedan sin vínculo
        await Promise.all(
            DIRECTORY_MODELS.map((model) =>
                model.updateMany({ helpPoint: point._id }, { $set: { helpPoint: null } })
            )
        );

        return point;
    }
}

module.exports = HelpPointsService;
