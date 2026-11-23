"use strict";

const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/token");

// Protege las rutas internas: exige el header
// Authorization: Bearer <token>
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new AppError(401, "Debes iniciar sesión para acceder a este recurso."));
    }

    try {
        const payload = verifyToken(token);

        req.user = {
            id: payload.sub,
            name: payload.name,
            email: payload.email
        };

        next();
    } catch (error) {
        next(new AppError(401, "Tu sesión no es válida o ya expiró. Inicia sesión de nuevo."));
    }
}

module.exports = {
    requireAuth
};
