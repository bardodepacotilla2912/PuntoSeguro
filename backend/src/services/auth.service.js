"use strict";

const bcrypt = require("bcryptjs");

const UserModel = require("../models/user.model");
const AppError = require("../utils/appError");
const { signToken } = require("../utils/token");

const SALT_ROUNDS = 10;

class AuthService {

    async register({ name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        // No se permiten correos duplicados
        const exists = await UserModel.exists({ email: normalizedEmail });

        if (exists) {
            throw new AppError(400, "Ya existe una cuenta registrada con ese correo.");
        }

        // La contraseña nunca se guarda en texto plano
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return {
            token: signToken(user),
            user
        };
    }

    async login({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        // select("+password") porque en el modelo está oculta
        const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

        // Mismo mensaje para "no existe" y "contraseña incorrecta"
        const invalidMessage = "Correo o contraseña incorrectos.";

        if (!user) {
            throw new AppError(401, invalidMessage);
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new AppError(401, invalidMessage);
        }

        return {
            token: signToken(user),
            user
        };
    }

    async getProfile(userId) {
        const user = await UserModel.findById(userId);

        if (!user) {
            throw new AppError(401, "El usuario de la sesión ya no existe.");
        }

        return user;
    }
}

module.exports = AuthService;
