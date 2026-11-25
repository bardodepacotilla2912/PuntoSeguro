"use strict";
const express = require("express");

const AuthService = require("../services/auth.service");

const {
    validateRegister,
    validateLogin
} = require("../middlewares/auth.validator");

const router = express.Router();
const service = new AuthService();

router.post("/register", validateRegister, async (req, res) => {
    const user = await service.register(req.body);

    res.status(201).json({
        message: "Cuenta creada correctamente",
        data: user
    });
});

router.post("/login", validateLogin, async (req, res) => {
    const user = await service.login(req.body);

    res.status(200).json({
        message: "Inicio de sesión correcto",
        data: user
    });
});

module.exports = router;
