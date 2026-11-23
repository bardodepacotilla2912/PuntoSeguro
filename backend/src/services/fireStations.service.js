"use strict";

const FireStationModel = require("../models/fireStation.model");
const DirectoryService = require("./directory.service");

class FireStationsService extends DirectoryService {
    constructor() {
        super({
            model: FireStationModel,
            label: "la estación de bomberos",
            categorySlug: "bomberos",
            fields: ["name", "phone", "address", "status", "units", "chief"]
        });
    }
}

module.exports = FireStationsService;
