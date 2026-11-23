"use strict";

const mongoose = require("mongoose");

const CategoryModel = require("../models/category.model");
const AppError = require("../utils/appError");

class CategoriesService {

    async getAll() {
        return CategoryModel.find().sort({ name: 1 });
    }

    async getById(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(404, `No se encontró la categoría con ID ${id}`);
        }

        const category = await CategoryModel.findById(id);

        if (!category) {
            throw new AppError(404, `No se encontró la categoría con ID ${id}`);
        }

        return category;
    }
}

module.exports = CategoriesService;
