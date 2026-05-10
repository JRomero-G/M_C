const express = require('express');
const routerAuth = express.Router();

const auth_Controller = require('../middleware/Auth-restablecer-password');


// Rutas de autenticación
routerAuth.post("/forgot-password", auth_Controller.OlvideMiContraseña);

module.exports = routerAuth;