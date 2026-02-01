const express = require('express');
const ProductosRouter = express.Router();
const ProductosController = require('../controllers/Productos-controller');
const AuthMiddleware = require('../middleware/Auth');

// ========== RUTAS PÚBLICAS ==========
ProductosRouter.get('/catalogo', ProductosController.obtenerProductosCatalogo);
ProductosRouter.get('/categoria/:categoria', ProductosController.obtenerProductosPorCategoria);

// ========== MIDDLEWARE DE AUTENTICACIÓN ==========
ProductosRouter.use(AuthMiddleware.verificarToken);

// ========== RUTAS PROTEGIDAS ==========
// RUTAS ESPECÍFICAS PRIMERO (antes de /:id)
ProductosRouter.get('/gestion', 
  AuthMiddleware.verificarRol('admin', 'tienda'), 
  ProductosController.obtenerProductosGestion2
);
ProductosRouter.get('/gestion/activos', 
  AuthMiddleware.verificarRol('admin', 'tienda'), 
  ProductosController.obtenerCantidadProductosActivos
);

ProductosRouter.post('/subir-imagen', ProductosController.subirImagen);
ProductosRouter.delete('/imagenes/eliminar-unica', ProductosController.eliminarImagenCloudinary);
ProductosRouter.delete('/imagenes/eliminar-multiple', ProductosController.eliminarMultiplesImagenesCloudinary);

// RUTAS CON PARÁMETROS DESPUÉS
ProductosRouter.get('/:id', ProductosController.obtenerProductoPorId);
ProductosRouter.post('/',AuthMiddleware.verificarAdmin,ProductosController.crearProducto);
ProductosRouter.put('/:id', 
  AuthMiddleware.verificarRol('admin', 'tienda'), 
  ProductosController.actualizarProducto
);
ProductosRouter.put('/:id/estado', 
  AuthMiddleware.verificarAdmin, 
  ProductosController.CambiarEstadoProducto
);

module.exports = ProductosRouter;
//VERSION 2