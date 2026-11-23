"use strict";
const express = require("express");

const { requireAuth } = require("../middlewares/auth.handler");

const authRouter = require("./auth.router");
const categoriesRouter = require("./categories.router");
const helpPointsRouter = require("./helpPoints.router");
const zonesRouter = require("./zones.router");
const hospitalsRouter = require("./hospitals.router");
const fireStationsRouter = require("./fireStations.router");
const policeStationsRouter = require("./policeStations.router");
const pharmaciesRouter = require("./pharmacies.router");

function routerApi(app) {
    const apiRouter = express.Router();

    app.use("/api", apiRouter);

    // Rutas públicas: registro e inicio de sesión
    apiRouter.use("/auth", authRouter);

    // Rutas internas: requieren token
    apiRouter.use("/categories", requireAuth, categoriesRouter);
    apiRouter.use("/help-points", requireAuth, helpPointsRouter);
    apiRouter.use("/zones", requireAuth, zonesRouter);
    apiRouter.use("/hospitals", requireAuth, hospitalsRouter);
    apiRouter.use("/fire-stations", requireAuth, fireStationsRouter);
    apiRouter.use("/police-stations", requireAuth, policeStationsRouter);
    apiRouter.use("/pharmacies", requireAuth, pharmaciesRouter);
}

module.exports = routerApi;
