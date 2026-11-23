"use strict";
const express = require("express");

const ZonesService = require("../services/zones.service");
const { validateZonePayload } = require("../middlewares/zone.validator");

const router = express.Router();
const service = new ZonesService();

router.get("/", async (req, res) => {
    const zones = await service.getAll();

    res.status(200).json({
        count: zones.length,
        data: zones
    });
});

router.get("/geojson", async (req, res) => {
    const geoJSON = await service.getGeoJSON();

    res.status(200).json(geoJSON);
});

router.get("/:id", async (req, res) => {
    const zone = await service.getById(req.params.id);

    res.status(200).json({
        data: zone
    });
});

router.post("/", validateZonePayload({ partial: false }), async (req, res) => {
    const zone = await service.create(req.body, req.user.id);

    res.status(201).json({
        message: "Zona guardada correctamente",
        data: zone
    });
});

router.patch("/:id", validateZonePayload({ partial: true }), async (req, res) => {
    const zone = await service.update(req.params.id, req.body);

    res.status(200).json({
        message: "Zona actualizada correctamente",
        data: zone
    });
});

router.delete("/:id", async (req, res) => {
    const zone = await service.delete(req.params.id);

    res.status(200).json({
        message: "Zona eliminada correctamente",
        data: zone
    });
});

module.exports = router;
