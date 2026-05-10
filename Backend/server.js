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
require("./models/Reset_pass");

// RUTAS
const productosRoutes = require("./routes/Productos-routes");
const usuariosRoutes = require("./routes/Usuarios-routes");
const pedidosRoutes = require("./routes/Pedidos-routes");
const authRoutes = require("./routes/Auth-routes");


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
app.use("/api/auth", authRoutes);

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

// TEMPORAL: Para depurar rutas registradas
app.get("/debug-routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            method: Object.keys(handler.route.methods)[0]
          });
        }
      });
    }
  });
  res.json(routes);
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT;
const correo = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Servidor en https://m-c-h5or.onrender.com:${PORT}`);
  console.log(`Ruta Reset Pass: https://m-c-h5or.onrender.com/api/auth/forgot-password`);
  console.log("=".repeat(50));
});