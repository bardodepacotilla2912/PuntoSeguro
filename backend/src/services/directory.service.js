"use strict";

const mongoose = require("mongoose");

const HelpPointModel = require("../models/helpPoint.model");
const AppError = require("../utils/appError");
const { buildSearchRegex } = require("../utils/search");

/*
 * Lógica común del CRUD del directorio.
 * Cada entidad (hospitales, bomberos, policía, farmacias) tiene su propio
 * servicio que hereda de esta clase y le indica:
 *  - model:        el modelo de Mongoose
 *  - label:        nombre para los mensajes ("el hospital")
 *  - categorySlug: categoría que debe tener el punto del mapa vinculado
 *  - fields:       campos que se pueden guardar / editar
 */
class DirectoryService {

    constructor({ model, label, categorySlug, fields }) {
        this.model = model;
        this.label = label;
        this.categorySlug = categorySlug;
        this.fields = fields;

        this.populate = [
            {
                path: "helpPoint",
                select: "name location status category",
                populate: { path: "category", select: "name slug color icon" }
            },
            { path: "createdBy", select: "name email" }
        ];
    }

    async getAll(filters = {}) {
        const { search = "", status = "all" } = filters;
        const query = {};

        if (status && status !== "all") {
            query.status = status;
        }

        const text = String(search).trim();
        if (text) {
            const regex = buildSearchRegex(text);
            query.$or = [{ name: regex }, { address: regex }];
        }

        return this.model.find(query).populate(this.populate).sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró ${this.label} con ID ${id}`);
        }

        const item = await this.model.findById(id).populate(this.populate);

        if (!item) {
            throw new AppError(404, `No se encontró ${this.label} con ID ${id}`);
        }

        return item;
    }

    // El punto del mapa vinculado debe existir y ser de la misma categoría
    async checkHelpPoint(helpPointId) {
        if (!helpPointId) {
            return null;
        }

        const point = await HelpPointModel.findById(helpPointId).populate("category", "slug name");

        if (!point) {
            throw new AppError(400, "El punto del mapa seleccionado no existe.");
        }

        if (point.category?.slug !== this.categorySlug) {
            throw new AppError(
                400,
                `El punto "${point.name}" es de la categoría ${point.category?.name}; selecciona uno de la categoría correcta.`
            );
        }

        return point._id;
    }

    pickFields(data) {
        const values = {};

        this.fields.forEach((field) => {
            if (data[field] !== undefined) {
                values[field] = data[field];
            }
        });

        return values;
    }

    async create(data, userId) {
        const values = this.pickFields(data);
        values.helpPoint = await this.checkHelpPoint(data.helpPoint);
        values.createdBy = userId;

        const item = await this.model.create(values);

        return this.getById(item.id);
    }

    async update(id, changes) {
        const item = await this.getById(id);
        const values = this.pickFields(changes);

        if (changes.helpPoint !== undefined) {
            values.helpPoint = await this.checkHelpPoint(changes.helpPoint);
        }

        item.set(values);
        await item.save();

        return this.getById(id);
    }

    async delete(id) {
        const item = await this.getById(id);

        await item.deleteOne();

        return item;
    }
}

module.exports = DirectoryService;
