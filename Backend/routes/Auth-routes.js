const express = require('express');
const routerAuth = express.Router();

const auth_Controller = require('../middleware/Auth-restablecer-password');


// Log para confirmar que el router recibe la petición
routerAuth.use((req, res, next) => {
  console.log(`🔵 Auth router recibió: ${req.method} ${req.url}`);
  next();
});

// Rutas de autenticación
routerAuth.post("/forgot-password", auth_Controller.OlvideMiContraseña);

module.exports = routerAuth;