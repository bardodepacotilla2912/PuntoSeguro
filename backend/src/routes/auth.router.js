"use strict";
const express = require("express");

const AuthService = require("../services/auth.service");
const { validateRegister, validateLogin } = require("../middlewares/auth.validator");
const { requireAuth } = require("../middlewares/auth.handler");

const router = express.Router();
const service = new AuthService();

router.post("/register", validateRegister, async (req, res) => {
    const result = await service.register(req.body);

    res.status(201).json({
        message: "Cuenta creada correctamente",
        data: result
    });
});

router.post("/login", validateLogin, async (req, res) => {
    const result = await service.login(req.body);

    res.status(200).json({
        message: "Inicio de sesión correcto",
        data: result
    });
});

router.get("/me", requireAuth, async (req, res) => {
    const user = await service.getProfile(req.user.id);

    res.status(200).json({
        data: user
    });
});

module.exports = router;
