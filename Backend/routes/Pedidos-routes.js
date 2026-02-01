const express = require('express');
const pedidoRouter = express.Router();

const PedidosController = require('../controllers/Pedidos-controller');
const AuthMiddleware = require('../middleware/Auth');

/* =============================
   RUTAS PÚBLICAS (CLIENTE)
   ============================= */

// Crear pedido (cliente sin login)
// POST /api/pedidos
pedidoRouter.post('/', 
    PedidosController.crearPedidoPublico // Asegúrate que el nombre coincida
);

/* =============================
   RUTAS PROTEGIDAS (ADMIN / TIENDA)
   ============================= */

pedidoRouter.use(AuthMiddleware.verificarToken);

// Ver todos los pedidos (con filtros y paginación)
// GET /api/pedidos?estado=confirmado&page=1&limit=20
pedidoRouter.get('/',
    AuthMiddleware.verificarRol('admin', 'tienda'),
    PedidosController.obtenerPedidos
);

// Agrega estas rutas:
pedidoRouter.get('/pedidos-mes', AuthMiddleware.verificarRol('admin', 'tienda'), PedidosController.obtenerTotalPedidosPorMes);
pedidoRouter.get('/ventas-mes', AuthMiddleware.verificarRol('admin', 'tienda'), PedidosController.obtenerTotalVentasPorMes);
pedidoRouter.get('/ventas-dia', AuthMiddleware.verificarRol('admin', 'tienda'), PedidosController.obtenerVentasPorDia);

// Ver pedido específico por ID o identificador
// GET /api/pedidos/:id
pedidoRouter.get('/:id',
    AuthMiddleware.verificarRol('admin', 'tienda'),
    PedidosController.obtenerPedidoPorId
);

// Actualizar estado del pedido (tienda y admin)
// PUT /api/pedidos/:id/estado
pedidoRouter.put('/:id/estado',
    AuthMiddleware.verificarRol('admin', 'tienda'),
    PedidosController.actualizarEstadoPedido
);

// Cancelar pedido (solo admin)
// PUT /api/pedidos/:id/cancelar
pedidoRouter.put('/:id/cancelar',
    AuthMiddleware.verificarRol('admin', 'tienda'),
    PedidosController.cancelarPedido
);

module.exports = pedidoRouter;