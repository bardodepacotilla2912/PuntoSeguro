"use strict";

const app = require("./app");

const {
    connectDataBase,
    disconnectDataBase
} = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try {
        // 1.- Primero se abre la conexión con la base de datos
        await connectDataBase();

        // 2.- Después se levanta el servidor HTTP
        const server = app.listen(PORT, () => {
            console.log("");
            console.log("===================================");
            console.log("PUNTOSEGURO API");
            console.log("===================================");
            console.log(`Servidor:     http://localhost:${PORT}`);
            console.log(`Health:       http://localhost:${PORT}/api/health`);
            console.log(`Help points:  http://localhost:${PORT}/api/help-points`);
            console.log(`Zonas:        http://localhost:${PORT}/api/zones`);
            console.log("===================================");
            console.log("");
        });

        // Cierre controlado
        function shutdown(signal) {
            console.log(`\nSe recibió ${signal}`);

            server.close(async () => {
                await disconnectDataBase();
                console.log("Servidor y base de datos cerrados correctamente");
                process.exit(0);
            });
        }

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.log("No se pudo conectar a MongoDB:", error.message);
        process.exit(1);
    }
}

startServer();
