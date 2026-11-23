"use strict";

const PharmacyModel = require("../models/pharmacy.model");
const DirectoryService = require("./directory.service");

class PharmaciesService extends DirectoryService {
    constructor() {
        super({
            model: PharmacyModel,
            label: "la farmacia",
            categorySlug: "farmacia",
            fields: ["name", "phone", "address", "status", "chain", "is24h", "delivery"]
        });
    }
}

module.exports = PharmaciesService;
