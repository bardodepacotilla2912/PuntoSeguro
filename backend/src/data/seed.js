"use strict";

require("dotenv").config();

const bcrypt = require("bcryptjs");

const { connectDataBase, disconnectDataBase } = require("../config/database");

const UserModel = require("../models/user.model");
const CategoryModel = require("../models/category.model");
const HelpPointModel = require("../models/helpPoint.model");
const ZoneModel = require("../models/zone.model");
const HospitalModel = require("../models/hospital.model");
const FireStationModel = require("../models/fireStation.model");
const PoliceStationModel = require("../models/policeStation.model");
const PharmacyModel = require("../models/pharmacy.model");

const { categories, helpPoints, zones } = require("./seed.data");

// Modelo del directorio que corresponde a cada categoría
const DIRECTORY_BY_CATEGORY = {
    hospital: HospitalModel,
    bomberos: FireStationModel,
    policia: PoliceStationModel,
    farmacia: PharmacyModel
};

// Usuario de prueba (se puede cambiar desde .env)
const DEMO_USER = {
    name: process.env.SEED_USER_NAME || "Usuario Demo",
    email: process.env.SEED_USER_EMAIL || "demo@puntoseguro.com",
    password: process.env.SEED_USER_PASSWORD || "Demo2026!"
};

async function runSeed() {
    try {
        await connectDataBase();

        // 1.- Limpiar las colecciones (los usuarios NO se borran)
        await Promise.all([
            CategoryModel.deleteMany({}),
            HelpPointModel.deleteMany({}),
            ZoneModel.deleteMany({}),
            HospitalModel.deleteMany({}),
            FireStationModel.deleteMany({}),
            PoliceStationModel.deleteMany({}),
            PharmacyModel.deleteMany({})
        ]);

        // Asegura que existan los índices 2dsphere
        await Promise.all([HelpPointModel.syncIndexes(), ZoneModel.syncIndexes()]);

        // 2.- Usuario de prueba (se crea o se actualiza su contraseña)
        const password = await bcrypt.hash(DEMO_USER.password, 10);
        const user = await UserModel.findOneAndUpdate(
            { email: DEMO_USER.email.toLowerCase() },
            { name: DEMO_USER.name, email: DEMO_USER.email.toLowerCase(), password },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        console.log(`Usuario de prueba listo: ${user.email}`);

        // 3.- Categorías
        const insertedCategories = await CategoryModel.insertMany(categories);
        const categoryBySlug = new Map(insertedCategories.map((c) => [c.slug, c]));
        console.log(`Se insertaron ${insertedCategories.length} categorías`);

        // 4.- Puntos de ayuda + su entrada en el directorio
        let directoryCount = 0;

        for (const item of helpPoints) {
            const category = categoryBySlug.get(item.category);

            const point = await HelpPointModel.create({
                name: item.name,
                description: item.description,
                category: category._id,
                status: item.status || "activo",
                phone: item.phone,
                schedule: item.schedule,
                location: { type: "Point", coordinates: item.coordinates },
                createdBy: user._id
            });

            if (item.directory) {
                await DIRECTORY_BY_CATEGORY[item.category].create({
                    name: item.name,
                    phone: item.phone,
                    ...item.directory,
                    helpPoint: point._id,
                    createdBy: user._id
                });
                directoryCount += 1;
            }
        }
        console.log(`Se insertaron ${helpPoints.length} puntos de ayuda`);
        console.log(`Se insertaron ${directoryCount} registros del directorio`);

        // 5.- Zonas
        const insertedZones = await ZoneModel.insertMany(
            zones.map((zone) => ({
                name: zone.name,
                description: zone.description,
                color: zone.color,
                area: { type: "Polygon", coordinates: zone.coordinates },
                createdBy: user._id
            }))
        );
        console.log(`Se insertaron ${insertedZones.length} zonas`);

    } catch (error) {
        console.log("Error al cargar los datos:", error.message);
        process.exitCode = 1;
    } finally {
        await disconnectDataBase();
    }
}

runSeed();
