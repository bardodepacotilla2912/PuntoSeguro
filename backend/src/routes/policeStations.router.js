"use strict";

const PoliceStationsService = require("../services/policeStations.service");
const buildDirectoryRouter = require("./directory.router");
const {
    validatePoliceStationPayload,
    validatePoliceStationQuery
} = require("../middlewares/directory.validator");

module.exports = buildDirectoryRouter({
    service: new PoliceStationsService(),
    validatePayload: validatePoliceStationPayload,
    validateQuery: validatePoliceStationQuery,
    name: "Módulo de policía"
});
