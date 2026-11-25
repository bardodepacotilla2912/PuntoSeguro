"use strict";
const express = require("express");

const PoliceStationsService = require("../services/policeStations.service");

const {
    validatePoliceStationPayload,
    validatePoliceStationQuery
} = require("../middlewares/policeStation.validator");

const router = express.Router();
const service = new PoliceStationsService();

router.get("/", validatePoliceStationQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
        type: req.query.type,
        status: req.query.status
    };

    const stations = await service.getAll(filters);

    res.status(200).json({
        count: stations.length,
        data: stations
    });
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const station = await service.getById(id);

    res.status(200).json({
        data: station
    });
});

router.post("/", validatePoliceStationPayload({ partial: false }), async (req, res) => {
    const station = await service.create(req.body);

    res.status(201).json({
        message: "Módulo de policía creado correctamente",
        data: station
    });
});

router.patch("/:id", validatePoliceStationPayload({ partial: true }), async (req, res) => {
    const { id } = req.params;

    const station = await service.update(id, req.body);

    res.status(200).json({
        message: "Módulo de policía actualizado correctamente",
        data: station
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const station = await service.delete(id);

    res.status(200).json({
        message: "Módulo de policía eliminado correctamente",
        data: station
    });
});

module.exports = router;
