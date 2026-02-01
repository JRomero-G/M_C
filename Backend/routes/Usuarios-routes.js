// routes/usuarios.js - VERSIÓN CORREGIDA
const express = require('express');
const UsuariosRouter = express.Router();
const UsuariosController = require('../controllers/Usuarios-controller'); // Cambié el nombre
const AuthMiddleware = require('../middleware/Auth'); // Importar la clase completa

// ========== RUTAS PÚBLICAS ==========
UsuariosRouter.post('/login', UsuariosController.login);

// ========== RUTAS PROTEGIDAS ==========
// Usar los métodos estáticos de la clase AuthMiddleware
UsuariosRouter.use(AuthMiddleware.verificarToken);

// Perfil del usuario actual
UsuariosRouter.get('/perfil', UsuariosController.obtenerPerfil);
UsuariosRouter.put('/perfil', UsuariosController.actualizarPerfil);
UsuariosRouter.put('/perfil/cambiar-password', UsuariosController.cambiarPasswordActual);

// ========== RUTAS DE ADMINISTRACIÓN ==========
// Usar el middleware de verificación de rol
UsuariosRouter.use(AuthMiddleware.verificarRol('admin'));

// CRUD completo
UsuariosRouter.post('/registro', UsuariosController.CrearUsuario);
UsuariosRouter.get('/', UsuariosController.obtenerUsuarios);
UsuariosRouter.get('/estadisticas', UsuariosController.obtenerEstadisticas);
UsuariosRouter.get('/:id', UsuariosController.obtenerUsuarioPorId);
UsuariosRouter.put('/:id', UsuariosController.ActualizarUsuario);
UsuariosRouter.delete('/:id', UsuariosController.eliminarUsuario);
UsuariosRouter.put('/:id/cambiar-estado', UsuariosController.cambiarEstadoUsuario);
UsuariosRouter.put('/:id/cambiar-password', UsuariosController.cambiarPassword);

module.exports = UsuariosRouter;