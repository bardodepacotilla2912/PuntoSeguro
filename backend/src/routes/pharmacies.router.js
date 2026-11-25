"use strict";
const express = require("express");

const PharmaciesService = require("../services/pharmacies.service");

const {
    validatePharmacyPayload,
    validatePharmacyQuery
} = require("../middlewares/pharmacy.validator");

const router = express.Router();
const service = new PharmaciesService();

router.get("/", validatePharmacyQuery, async (req, res) => {
    const filters = {
        search: req.query.search,
        status: req.query.status
    };

    const pharmacies = await service.getAll(filters);

    res.status(200).json({
        count: pharmacies.length,
        data: pharmacies
    });
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const pharmacy = await service.getById(id);

    res.status(200).json({
        data: pharmacy
    });
});

router.post("/", validatePharmacyPayload({ partial: false }), async (req, res) => {
    const pharmacy = await service.create(req.body);

    res.status(201).json({
        message: "Farmacia creada correctamente",
        data: pharmacy
    });
});

router.patch("/:id", validatePharmacyPayload({ partial: true }), async (req, res) => {
    const { id } = req.params;

    const pharmacy = await service.update(id, req.body);

    res.status(200).json({
        message: "Farmacia actualizada correctamente",
        data: pharmacy
    });
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const pharmacy = await service.delete(id);

    res.status(200).json({
        message: "Farmacia eliminada correctamente",
        data: pharmacy
    });
});

module.exports = router;
