"use strict";

const PharmaciesService = require("../services/pharmacies.service");
const buildDirectoryRouter = require("./directory.router");
const {
    validatePharmacyPayload,
    validatePharmacyQuery
} = require("../middlewares/directory.validator");

module.exports = buildDirectoryRouter({
    service: new PharmaciesService(),
    validatePayload: validatePharmacyPayload,
    validateQuery: validatePharmacyQuery,
    name: "Farmacia",
    female: true
});
