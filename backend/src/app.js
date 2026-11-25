"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const routerApi = require("./routes");
const AppError = require("./utils/appError");

const {
    notFoundHandler,
    errorHandler,
    logErrors
} = require("./middlewares/error.handler");

const app = express();

// Orígenes del frontend que pueden consumir la API (separados por coma)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Peticiones sin origen (Postman, curl, servidor a servidor)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new AppError(403, `Origen no permitido: ${origin}`));
    }
}));

// Procesar JSON (máximo 100 kb por petición)
app.use(express.json({ limit: "100kb" }));

// Log de cada petición
app.use((req, res, next) => {
    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
});

app.get("/", (req, res) => {
    res.status(200).json({
        name: "PuntoSeguro API - Red de puntos de ayuda",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            register: "/api/auth/register",
            login: "/api/auth/login",
            categories: "/api/categories",
            helpPoints: "/api/help-points?search=&category=&status=",
            geojson: "/api/help-points/geojson",
            nearest: "/api/help-points/nearest?lat=&lng=&category=",
            zones: "/api/zones",
            hospitals: "/api/hospitals",
            fireStations: "/api/fire-stations",
            policeStations: "/api/police-stations",
            pharmacies: "/api/pharmacies"
        }
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "El servidor funciona correctamente",
        timestamp: new Date().toISOString()
    });
});

routerApi(app);

app.use(notFoundHandler);
app.use(logErrors);
app.use(errorHandler);

module.exports = app;
