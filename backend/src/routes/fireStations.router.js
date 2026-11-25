"use strict";
const express = require("express");

const FireStationsService = require("../services/fireStations.service");

const {
    validateFireStationPayload,
    validateFireStationQuery
} = require("../middlewares/fireStation.validator");

const router = express.Router();
const service = new FireStationsService();

router.get("/", validateFireStationQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
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

router.post("/", validateFireStationPayload({ partial: false }), async (req, res) => {
    const station = await service.create(req.body);

    res.status(201).json({
        message: "Estación de bomberos creada correctamente",
        data: station
    });
});

router.patch("/:id", validateFireStationPayload({ partial: true }), async (req, res) => {
    const { id } = req.params;

    const station = await service.update(id, req.body);

    res.status(200).json({
        message: "Estación de bomberos actualizada correctamente",
        data: station
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const station = await service.delete(id);

    res.status(200).json({
        message: "Estación de bomberos eliminada correctamente",
        data: station
    });
});

module.exports = router;
