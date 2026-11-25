"use strict";
const express = require("express");

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

    apiRouter.use("/auth", authRouter);
    apiRouter.use("/categories", categoriesRouter);
    apiRouter.use("/help-points", helpPointsRouter);
    apiRouter.use("/zones", zonesRouter);
    apiRouter.use("/hospitals", hospitalsRouter);
    apiRouter.use("/fire-stations", fireStationsRouter);
    apiRouter.use("/police-stations", policeStationsRouter);
    apiRouter.use("/pharmacies", pharmaciesRouter);
}

module.exports = routerApi;
