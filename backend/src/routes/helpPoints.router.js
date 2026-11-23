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

function readFilters(query) {
    return {
        search: query.search,
        category: query.category,
        status: query.status,
        zone: query.zone
    };
}

// GET /api/help-points?search=&category=&status=&zone=
router.get("/", validateHelpPointQuery, async (req, res) => {
    const points = await service.getAll(readFilters(req.query));

    res.status(200).json({
        count: points.length,
        data: points
    });
});

// GET /api/help-points/geojson (mismos filtros, formato FeatureCollection)
router.get("/geojson", validateHelpPointQuery, async (req, res) => {
    const geoJSON = await service.getGeoJSON(readFilters(req.query));

    res.status(200).json(geoJSON);
});

// GET /api/help-points/nearest?lat=&lng=&category=&limit=&maxDistance=
router.get("/nearest", validateNearestQuery, async (req, res) => {
    const points = await service.getNearest({
        lat: req.query.lat,
        lng: req.query.lng,
        category: req.query.category,
        limit: req.query.limit ?? 5,
        maxDistance: req.query.maxDistance ?? 20
    });

    res.status(200).json({
        count: points.length,
        data: points
    });
});

router.get("/:id", async (req, res) => {
    const point = await service.getById(req.params.id);

    res.status(200).json({
        data: point
    });
});

router.post("/", validateHelpPointPayload({ partial: false }), async (req, res) => {
    const point = await service.create(req.body, req.user.id);

    res.status(201).json({
        message: "Punto de ayuda registrado correctamente",
        data: point
    });
});

router.patch("/:id", validateHelpPointPayload({ partial: true }), async (req, res) => {
    const point = await service.update(req.params.id, req.body);

    res.status(200).json({
        message: "Punto de ayuda actualizado correctamente",
        data: point
    });
});

router.delete("/:id", async (req, res) => {
    const point = await service.delete(req.params.id);

    res.status(200).json({
        message: "Punto de ayuda eliminado correctamente",
        data: point
    });
});

module.exports = router;
