// server.js - VERSIÓN COMPROBADA
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");

// IMPORTAR LA FUNCIÓN DE CONEXIÓN
const connectDB = require("./database");

// MODELOS
require("./models/Usuarios");
require("./models/Producto");
require("./models/Pedidos");
require("./models/Pedido-detalle");

// RUTAS
const productosRoutes = require("./routes/Productos-routes");
const usuariosRoutes = require("./routes/Usuarios-routes");
const pedidosRoutes = require("./routes/Pedidos-routes");

const app = express();

// ========== CONFIGURACIÓN CORS SIMPLIFICADA ==========
// SOLUCIÓN: Usar solo esto, eliminar app.options()
app.use(cors());

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ========== CONECTAR MONGO ==========
connectDB();

// ========== RUTAS ==========
app.use("/api/productos", productosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/pedidos", pedidosRoutes);

// ========== RUTAS BÁSICAS ==========
app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Venta de Muebles funcionando",
    status: "online",
    timestamp: new Date().toISOString()
  });
});


// ========== MANEJO DE ERRORES ==========
// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada"
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor"
  });
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log("=".repeat(50));
});