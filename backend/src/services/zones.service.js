"use strict";

const mongoose = require("mongoose");

const ZoneModel = require("../models/zone.model");
const HelpPointModel = require("../models/helpPoint.model");
const AppError = require("../utils/appError");

class ZonesService {

    async getAll() {
        const zones = await ZoneModel.find()
            .populate({ path: "createdBy", select: "name email" })
            .sort({ createdAt: 1 });

        // Cuántos puntos de ayuda hay dentro de cada zona
        const counts = await Promise.all(
            zones.map((zone) =>
                HelpPointModel.countDocuments({
                    location: {
                        $geoWithin: {
                            $geometry: { type: "Polygon", coordinates: zone.toObject().area.coordinates }
                        }
                    }
                })
            )
        );

        return zones.map((zone, index) => ({
            ...zone.toJSON(),
            pointsInside: counts[index]
        }));
    }

    async getGeoJSON() {
        const zones = await this.getAll();

        return {
            type: "FeatureCollection",
            features: zones.map(({ area, ...properties }) => ({
                type: "Feature",
                properties,
                geometry: area
            }))
        };
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró la zona con ID ${id}`);
        }

        const zone = await ZoneModel.findById(id).populate({ path: "createdBy", select: "name email" });

        if (!zone) {
            throw new AppError(404, `No se encontró la zona con ID ${id}`);
        }

        return zone;
    }

    async create(data, userId) {
        const zone = await ZoneModel.create({
            name: data.name,
            description: data.description || "",
            color: data.color || "#7c3aed",
            area: {
                type: "Polygon",
                coordinates: data.coordinates
            },
            createdBy: userId
        });

        return this.getById(zone.id);
    }

    async update(id, changes) {
        const zone = await this.getById(id);

        ["name", "description", "color"].forEach((field) => {
            if (changes[field] !== undefined) {
                zone[field] = changes[field] ?? "";
            }
        });

        if (changes.coordinates !== undefined) {
            zone.area = { type: "Polygon", coordinates: changes.coordinates };
        }

        await zone.save();

        return this.getById(id);
    }

    async delete(id) {
        const zone = await this.getById(id);

        await zone.deleteOne();

        return zone;
    }
}

module.exports = ZonesService;
