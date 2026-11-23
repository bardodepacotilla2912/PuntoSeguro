"use strict";

const PoliceStationModel = require("../models/policeStation.model");
const DirectoryService = require("./directory.service");

class PoliceStationsService extends DirectoryService {
    constructor() {
        super({
            model: PoliceStationModel,
            label: "el módulo de policía",
            categorySlug: "policia",
            fields: ["name", "phone", "address", "status", "type", "sector", "officers"]
        });
    }
}

module.exports = PoliceStationsService;
