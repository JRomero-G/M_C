// ========== INICIALIZACIÓN PRINCIPAL ==========

/**
 * Función principal de inicialización
 */
async function inicializarDashboard() {
  console.log("🚀 Inicializando dashboard...");

  // Verificar autenticación primero
  if (!verificarAutenticacion()) {
    console.log("❌ Autenticación fallida");
    return;
  }

  console.log("✅ Usuario autenticado");

  // Verificar rol para determinar funcionalidades
  const usuario = AuthService.getUsuario();
  console.log("👤 Usuario:", usuario);

  // Configuración básica
  configurarNavegacion();
  establecerFechasPorDefecto();
  configurarEventos();
  configurarCalculosPrecios();
  aplicarEstilosPorRol();

  // Cargar datos iniciales
  await cargarDatosIniciales(usuario.rol);

  // Actualizar dashboard
  await actualizarDashboard();

  console.log("✅ Dashboard completamente inicializado");
}

/**
 * Carga los datos iniciales según el rol
 */
async function cargarDatosIniciales(rol) {
  console.log(`📊 Cargando datos para rol: ${rol}`);

  try {
    // Todos ven estadísticas
    cargarPedidosRecientes();

    // Solo admin carga estos datos
    if (rol === "admin") {
      await cargarProductos();
      await cargarUsuariosDesdeBackend();
      //cargarCategorias();
    } else if (rol === "tienda") {
      // Tienda solo necesita pedidos para gestionar
      await cargarTablaPedidos();
    }
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error);
  }
}

/**
 * Configura la navegación entre secciones
 */
function configurarNavegacion() {
  console.log("🔧 Configurando navegación...");
  
  const botonesMenu = document.querySelectorAll(".menu-btn");
  console.log(`Encontrados ${botonesMenu.length} botones de menú`);
  
  botonesMenu.forEach((boton) => {
    boton.addEventListener("click", function () {
      console.log(`Click en sección: ${this.dataset.section}`);
      
      // Verificar permisos para la sección
      const seccion = this.dataset.section;
      const usuario = AuthService.getUsuario();

      if (
        usuario.rol === "tienda" &&
        [
          "productos",
          "registrar",
          "actualizar",
          "categorias",
          "usuarios",
        ].includes(seccion)
      ) {
        alert("Acceso restringido: Solo disponible para administradores");
        return;
      }

      // Quitar activo de todos los botones
      botonesMenu.forEach((b) => b.classList.remove("active"));
      
      // Activar botón actual
      this.classList.add("active");

      // Ocultar todas las secciones
      document.querySelectorAll(".content-section").forEach((seccionElem) => {
        seccionElem.classList.remove("active");
      });

      // Mostrar sección seleccionada
      const seccionId = seccion + "-section";
      const seccionElement = document.getElementById(seccionId);
      const tituloSeccion = document.getElementById("section-title");
      
      if (seccionElement) {
        seccionElement.classList.add("active");
        console.log(`Mostrando sección: ${seccionId}`);
      } else {
        console.error(`❌ No se encontró la sección: ${seccionId}`);
      }
      
      if (tituloSeccion) {
        tituloSeccion.textContent = this.querySelector("span").textContent;
      }

      // Si es la sección de dashboard, actualizar estadísticas
      if (seccion === "dashboard") {
        actualizarDashboard();
      }
    });
  });
  
  // Activar dashboard por defecto
  const dashboardBtn = document.querySelector('[data-section="dashboard"]');
  if (dashboardBtn) {
    dashboardBtn.click();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
  console.log("📄 DOM completamente cargado");
  setTimeout(() => {
    inicializarDashboard();
  }, 100);
});

// Exportar función principal
window.inicializarDashboard = inicializarDashboard;
window.cargarDatosIniciales = cargarDatosIniciales;
window.configurarNavegacion = configurarNavegacion;