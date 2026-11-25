"use strict";

const bcrypt = require("bcryptjs");

const UserModel = require("../models/user.model");
const AppError = require("../utils/appError");

class AuthService {

    async register(data) {
        const email = data.email.trim().toLowerCase();

        // No se permiten correos duplicados
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            throw new AppError(400, "Ya existe una cuenta registrada con ese correo.");
        }

        // La contraseña se cifra antes de guardarla
        const hashedPassword = await bcrypt.hash(data.password, 10);

        return UserModel.create({
            name: data.name.trim(),
            email,
            password: hashedPassword
        });
    }

    async login(data) {
        const email = data.email.trim().toLowerCase();

        const user = await UserModel.findOne({ email });

        if (!user) {
            throw new AppError(401, "Correo o contraseña incorrectos.");
        }

        // Compara la contraseña escrita con la versión cifrada de MongoDB
        const isValidPassword = await bcrypt.compare(data.password, user.password);

        if (!isValidPassword) {
            throw new AppError(401, "Correo o contraseña incorrectos.");
        }

        return user;
    }
}

module.exports = AuthService;
