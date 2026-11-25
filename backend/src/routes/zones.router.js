"use strict";
const express = require("express");

const ZonesService = require("../services/zones.service");

const {
    validateZonePayload
} = require("../middlewares/zone.validator");

const router = express.Router();
const service = new ZonesService();

router.get("/", async (req, res) => {
    const zones = await service.getAll();

    res.status(200).json({
        count: zones.length,
        data: zones
    });
});

router.post("/", validateZonePayload, async (req, res) => {
    const zone = await service.create(req.body);

    res.status(201).json({
        message: "Zona guardada correctamente",
        data: zone
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const zone = await service.delete(id);

    res.status(200).json({
        message: "Zona eliminada correctamente",
        data: zone
    });
});

module.exports = router;
