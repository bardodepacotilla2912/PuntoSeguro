"use strict";

const { createBodyValidator } = require("../utils/validate");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const registerRules = {
    name: { type: "string", required: true, min: 3, max: 80, label: "nombre" },
    email: {
        type: "string",
        required: true,
        max: 120,
        pattern: EMAIL_PATTERN,
        patternMessage: "El correo electrónico no tiene un formato válido.",
        label: "correo"
    },
    password: {
        type: "custom",
        required: true,
        label: "contraseña",
        check(value) {
            if (typeof value !== "string" || value.length < 8) {
                return "La contraseña debe tener al menos 8 caracteres.";
            }
            if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
                return "La contraseña debe incluir al menos una letra y un número.";
            }
            if (value.length > 72) {
                return "La contraseña no debe superar los 72 caracteres.";
            }
            return null;
        }
    }
};

const loginRules = {
    email: { type: "string", required: true, max: 120, label: "correo" },
    password: { type: "custom", required: true, label: "contraseña", check: () => null }
};

const validateRegister = createBodyValidator(registerRules);
const validateLogin = createBodyValidator(loginRules);

module.exports = {
    validateRegister,
    validateLogin
};
