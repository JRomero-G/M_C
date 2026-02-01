const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

module.exports = (db) => {
    const admins = db.collection("administradores");

    // Ruta para crear admin (solo en desarrollo)
    router.post("/crear-admin", async (req, res) => {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        const existe = await admins.findOne({ usuario });

        if (existe) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        const hashed = await bcrypt.hash(password, 10);

        await admins.insertOne({
            usuario,
            password: hashed,
            rol: "Administrador",
        });

        res.json({ mensaje: "Administrador registrado correctamente" });
    });

    return router;
};
