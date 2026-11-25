"use strict";
const express = require("express");

const CategoriesService = require("../services/categories.service");

const router = express.Router();
const service = new CategoriesService();

router.get("/", async (req, res) => {
    const categories = await service.getAll();

    res.status(200).json({
        count: categories.length,
        data: categories
    });
});

module.exports = router;
