"use strict";

// Punto de entrada del backend en Vercel (función serverless).
//
// En local se usa src/index.js (npm run dev), que conecta MongoDB y llama a app.listen.
// En Vercel no hay un servidor encendido todo el tiempo: cada petición llega a esta
// función, se asegura la conexión con MongoDB y se le pasa a la misma app de Express.

const app = require("../src/app");
const { connectDataBase } = require("../src/config/database");

// La conexión se guarda para reutilizarla en las siguientes peticiones
let connection = null;

module.exports = async (req, res) => {
    try {
        if (!connection) {
            connection = connectDataBase();
        }

        await connection;
    } catch (error) {
        // Si falla, se intenta de nuevo en la siguiente petición
        connection = null;
        console.error("No se pudo conectar a MongoDB:", error.message);

        return res.status(500).json({
            error: {
                status: 500,
                message: "No se pudo conectar a la base de datos"
            }
        });
    }

    return app(req, res);
};
