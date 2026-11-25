"use strict";

const CategoryModel = require("../models/category.model");

class CategoriesService {

    async getAll() {
        return CategoryModel.find().sort({ name: 1 });
    }
}

module.exports = CategoriesService;
