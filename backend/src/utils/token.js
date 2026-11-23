"use strict";

const jwt = require("jsonwebtoken");

function getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("Falta la variable JWT_SECRET en el archivo .env");
    }

    return secret;
}

// Genera el token que el frontend envía en el header Authorization
function signToken(user) {
    return jwt.sign(
        { sub: user.id, name: user.name, email: user.email },
        getSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
}

// Devuelve el contenido del token o lanza un error si no es válido / expiró
function verifyToken(token) {
    return jwt.verify(token, getSecret());
}

module.exports = {
    signToken,
    verifyToken
};
