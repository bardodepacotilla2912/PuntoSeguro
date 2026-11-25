"use strict";

require("dotenv").config();

const bcrypt = require("bcryptjs");

const {
    connectDataBase,
    disconnectDataBase
} = require("../config/database");

const UserModel = require("../models/user.model");
const CategoryModel = require("../models/category.model");
const HelpPointModel = require("../models/helpPoint.model");
const ZoneModel = require("../models/zone.model");
const HospitalModel = require("../models/hospital.model");
const FireStationModel = require("../models/fireStation.model");
const PoliceStationModel = require("../models/policeStation.model");
const PharmacyModel = require("../models/pharmacy.model");

const data = require("./seed.data");

// Colecciones que no dependen de otras (se insertan tal cual)
const collections = [
    { name: "hospitales", model: HospitalModel, data: data.hospitals },
    { name: "estaciones de bomberos", model: FireStationModel, data: data.fireStations },
    { name: "módulos de policía", model: PoliceStationModel, data: data.policeStations },
    { name: "farmacias", model: PharmacyModel, data: data.pharmacies }
];

async function runSeed() {
    try {
        await connectDataBase();

        // 1.- Usuario de prueba (se borra si ya existía y se vuelve a crear)
        await UserModel.deleteOne({ email: data.demoUser.email });

        await UserModel.create({
            name: data.demoUser.name,
            email: data.demoUser.email,
            password: await bcrypt.hash(data.demoUser.password, 10)
        });

        console.log(`Usuario de prueba listo: ${data.demoUser.email}`);

        // 2.- Categorías
        await CategoryModel.deleteMany({});
        const categories = await CategoryModel.insertMany(data.categories);
        console.log(`Se insertaron ${categories.length} categorías en la base de datos`);

        // 3.- Puntos de ayuda: el nombre de la categoría se cambia por su ObjectId
        await HelpPointModel.deleteMany({});

        const helpPoints = data.helpPoints.map((point) => {
            const category = categories.find((item) => item.name === point.category);

            return {
                name: point.name,
                description: point.description,
                category: category._id,
                status: point.status,
                phone: point.phone,
                schedule: point.schedule,
                location: {
                    type: "Point",
                    coordinates: point.coordinates
                }
            };
        });

        const insertedPoints = await HelpPointModel.insertMany(helpPoints);
        console.log(`Se insertaron ${insertedPoints.length} puntos de ayuda en la base de datos`);

        // 4.- Zonas
        await ZoneModel.deleteMany({});

        const zones = data.zones.map((zone) => ({
            name: zone.name,
            area: {
                type: "Polygon",
                coordinates: zone.coordinates
            }
        }));

        const insertedZones = await ZoneModel.insertMany(zones);
        console.log(`Se insertaron ${insertedZones.length} zonas en la base de datos`);

        // 5.- Directorio (hospitales, bomberos, policía y farmacias)
        for (const { name, model, data: documents } of collections) {
            await model.deleteMany({});

            const inserted = await model.insertMany(documents);

            console.log(`Se insertaron ${inserted.length} ${name} en la base de datos`);
        }
    } catch (error) {
        console.log("Error al cargar los datos:", error.message);
        process.exitCode = 1;
    } finally {
        await disconnectDataBase();
    }
}

runSeed();
