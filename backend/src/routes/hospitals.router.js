"use strict";
const express = require("express");

const HospitalsService = require("../services/hospitals.service");

const {
    validateHospitalPayload,
    validateHospitalQuery
} = require("../middlewares/hospital.validator");

const router = express.Router();
const service = new HospitalsService();

router.get("/", validateHospitalQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
        type: req.query.type,
        status: req.query.status
    };

    const hospitals = await service.getAll(filters);

    res.status(200).json({
        count: hospitals.length,
        data: hospitals
    });
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const hospital = await service.getById(id);

    res.status(200).json({
        data: hospital
    });
});

router.post("/", validateHospitalPayload({ partial: false }), async (req, res) => {
    const hospital = await service.create(req.body);

    res.status(201).json({
        message: "Hospital creado correctamente",
        data: hospital
    });
});

router.patch("/:id", validateHospitalPayload({ partial: true }), async (req, res) => {
    const { id } = req.params;

    const hospital = await service.update(id, req.body);

    res.status(200).json({
        message: "Hospital actualizado correctamente",
        data: hospital
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const hospital = await service.delete(id);

    res.status(200).json({
        message: "Hospital eliminado correctamente",
        data: hospital
    });
});

module.exports = router;
