"use strict";
const express = require("express");

const HelpPointsService = require("../services/helpPoints.service");

const {
    validateHelpPointPayload,
    validateHelpPointQuery,
    validateNearestQuery
} = require("../middlewares/helpPoint.validator");

const router = express.Router();
const service = new HelpPointsService();

router.get("/", validateHelpPointQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
        category: req.query.category,
        status: req.query.status
    };

    const points = await service.getAll(filters);

    res.status(200).json({
        count: points.length,
        data: points
    });
});

router.get("/geojson", validateHelpPointQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
        category: req.query.category,
        status: req.query.status
    };

    const geoJSON = await service.getGeoJSON(filters);

    res.status(200).json(geoJSON);
});

// Puntos más cercanos a una coordenada: ?lat=&lng=&category=
router.get("/nearest", validateNearestQuery, async (req, res) => {
    const filters = {
        lat: req.query.lat,
        lng: req.query.lng,
        category: req.query.category
    };

    const points = await service.getNearest(filters);

    res.status(200).json({
        count: points.length,
        data: points
    });
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const point = await service.getById(id);

    res.status(200).json({
        data: point
    });
});

router.post("/", validateHelpPointPayload({ partial: false }), async (req, res) => {
    const point = await service.create(req.body);

    res.status(201).json({
        message: "Punto de ayuda registrado correctamente",
        data: point
    });
});

router.patch("/:id", validateHelpPointPayload({ partial: true }), async (req, res) => {
    const { id } = req.params;

    const point = await service.update(id, req.body);

    res.status(200).json({
        message: "Punto de ayuda actualizado correctamente",
        data: point
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const point = await service.delete(id);

    res.status(200).json({
        message: "Punto de ayuda eliminado correctamente",
        data: point
    });
});

module.exports = router;
