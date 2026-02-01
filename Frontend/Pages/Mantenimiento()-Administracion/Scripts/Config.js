// ========== CONFIGURACIÓN GLOBAL ==========
const BACKEND_URL = "http://localhost:3000/api";
const CLOUDINARY_CLOUD_NAME = "imgenesproductos";
const CLOUDINARY_UPLOAD_PRESET = "venta_muebles_unsigned";

// ========== VARIABLES GLOBALES ==========
let productos = [];
let pedidos = [];
let categorias = [];
let usuarios = [];
let productoAEliminar = null;
//IMAGENES
let imagenesRegistro = [];
let imagenesActualizacion = [];
let imagenesActualesProducto = [];
let imagenesMarcadasParaEliminar = [];

let todosLosPedidos = []; 

// Exportar configuración
window.BACKEND_URL = BACKEND_URL;
window.CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
window.CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;

// Variables globales
window.productos = productos;
window.pedidos = pedidos;
window.categorias = categorias;
window.usuarios = usuarios;
window.productoAEliminar = productoAEliminar;
window.imagenesRegistro = imagenesRegistro;
window.imagenesActualizacion = imagenesActualizacion;

// SOLUCIÓN: Declarar la propiedad de forma segura
if (typeof window !== 'undefined') {
    // Type-safe declaration
    window.imagenesActualesProducto = imagenesActualesProducto;
    window.imagenesMarcadasParaEliminar = imagenesMarcadasParaEliminar;
    window.todosLosPedidos = todosLosPedidos;
}