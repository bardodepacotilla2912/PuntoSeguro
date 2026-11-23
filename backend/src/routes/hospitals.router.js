"use strict";

const HospitalsService = require("../services/hospitals.service");
const buildDirectoryRouter = require("./directory.router");
const {
    validateHospitalPayload,
    validateHospitalQuery
} = require("../middlewares/directory.validator");

module.exports = buildDirectoryRouter({
    service: new HospitalsService(),
    validatePayload: validateHospitalPayload,
    validateQuery: validateHospitalQuery,
    name: "Hospital"
});
