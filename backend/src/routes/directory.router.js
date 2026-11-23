"use strict";
const express = require("express");

/*
 * Crea el router CRUD de una entidad del directorio.
 * Las rutas solo reciben la petición y llaman al servicio.
 *
 * service:         instancia del servicio de la entidad
 * validatePayload: fábrica del validador del body ({ partial })
 * validateQuery:   validador de los filtros (?search=&status=)
 * name:            nombre para los mensajes ("Hospital")
 * female:          true si el nombre es femenino ("Farmacia")
 */
function buildDirectoryRouter({ service, validatePayload, validateQuery, name, female = false }) {
    // "registrado" / "registrada" según el género del nombre
    const end = female ? "a" : "o";

    const router = express.Router();

    router.get("/", validateQuery, async (req, res) => {
        const items = await service.getAll({
            search: req.query.search,
            status: req.query.status
        });

        res.status(200).json({
            count: items.length,
            data: items
        });
    });

    router.get("/:id", async (req, res) => {
        const item = await service.getById(req.params.id);

        res.status(200).json({ data: item });
    });

    router.post("/", validatePayload({ partial: false }), async (req, res) => {
        const item = await service.create(req.body, req.user.id);

        res.status(201).json({
            message: `${name} registrad${end} correctamente`,
            data: item
        });
    });

    router.patch("/:id", validatePayload({ partial: true }), async (req, res) => {
        const item = await service.update(req.params.id, req.body);

        res.status(200).json({
            message: `${name} actualizad${end} correctamente`,
            data: item
        });
    });

    router.delete("/:id", async (req, res) => {
        const item = await service.delete(req.params.id);

        res.status(200).json({
            message: `${name} eliminad${end} correctamente`,
            data: item
        });
    });

    return router;
}

module.exports = buildDirectoryRouter;
