"use strict";

const AppError = require("../utils/appError");

// Formato básico de correo: texto@texto.texto
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nombre de persona: solo letras (con acentos) y espacios
const PERSON_NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

// Validación del registro de usuarios
function validateRegister(req, res, next) {
    const errors = [];
    const { name, email, password } = req.body || {};

    // Nombre
    if (typeof name !== "string" || name.trim().length < 3) {
        errors.push("El nombre debe contener al menos 3 caracteres.");
    } else if (name.trim().length > 80) {
        errors.push("El nombre no debe superar los 80 caracteres.");
    } else if (!PERSON_NAME_PATTERN.test(name.trim())) {
        errors.push("El nombre solo puede contener letras y espacios.");
    }

    // Correo
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
        errors.push("El correo electrónico no es válido.");
    }

    // Contraseña: mínimo 8 caracteres, con al menos una letra y un número
    if (typeof password !== "string" || password.length < 8) {
        errors.push("La contraseña debe contener al menos 8 caracteres.");
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        errors.push("La contraseña debe tener al menos una letra y un número.");
    }

    if (errors.length > 0) {
        return next(
            new AppError(400, "La información enviada no es válida", errors)
        );
    }

    next();
}

// Validación del inicio de sesión
function validateLogin(req, res, next) {
    const errors = [];
    const { email, password } = req.body || {};

    if (typeof email !== "string" || email.trim() === "") {
        errors.push("El correo es obligatorio.");
    }

    if (typeof password !== "string" || password === "") {
        errors.push("La contraseña es obligatoria.");
    }

    if (errors.length > 0) {
        return next(
            new AppError(400, "La información enviada no es válida", errors)
        );
    }

    next();
}

module.exports = {
    validateRegister,
    validateLogin
};
