"use strict";

const HospitalModel = require("../models/hospital.model");
const DirectoryService = require("./directory.service");

class HospitalsService extends DirectoryService {
    constructor() {
        super({
            model: HospitalModel,
            label: "el hospital",
            categorySlug: "hospital",
            fields: [
                "name", "phone", "address", "status",
                "type", "emergencyPhone", "beds", "specialties", "is24h"
            ]
        });
    }
}

module.exports = HospitalsService;
