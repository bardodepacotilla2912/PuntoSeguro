"use strict";

const FireStationsService = require("../services/fireStations.service");
const buildDirectoryRouter = require("./directory.router");
const {
    validateFireStationPayload,
    validateFireStationQuery
} = require("../middlewares/directory.validator");

module.exports = buildDirectoryRouter({
    service: new FireStationsService(),
    validatePayload: validateFireStationPayload,
    validateQuery: validateFireStationQuery,
    name: "Estación de bomberos",
    female: true
});
