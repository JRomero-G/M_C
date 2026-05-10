// ========== CONFIGURACIÓN DE EVENTOS ==========

/**
 * Configura todos los eventos del dashboard
 */
function configurarEventos() {
  console.log("🔄 Configurando eventos...");

  // Logout
  document.getElementById("logout")?.addEventListener("click", function (e) {
    e.preventDefault();
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      AuthService.logout();
    }
  });

  // Productos (solo para admin)
  if (AuthService.isAdmin()) {
    configurarEventosProductos();
  }

  // Pedidos (todos los roles)
  configurarEventosPedidos();

 

  // Imágenes (solo admin)
  if (AuthService.isAdmin()) {
    configurarEventosImagenes();
  }

  // Usuarios (solo admin)
  configurarEventosUsuarios();

  // Modal de confirmación
  configurarEventosModal();

  console.log("✅ Eventos configurados correctamente");
}

/**
 * Configura eventos relacionados con productos
 */
function configurarEventosProductos() {
  // Refresh productos
  document
    .getElementById("refreshProducts")
    ?.addEventListener("click", cargarProductos);
  
  // Formulario registrar
  document
    .getElementById("form-registrar")
    ?.addEventListener("submit", registrarProducto);
  
  // Formulario actualizar
  document
    .getElementById("form-actualizar")
    ?.addEventListener("submit", actualizarProducto);
  
  // Buscar para actualizar
  document
    .getElementById("btn-search-update")
    ?.addEventListener("click", buscarParaActualizar);
  
  // Limpiar formulario
  document
    .getElementById("btn-limpiar-form")
    ?.addEventListener("click", limpiarFormularioActualizar);
  
  // Buscador de productos
  document
    .getElementById("buscador-productos")
    ?.addEventListener("input", filtrarProductos);
}

/**
 * Configura eventos relacionados con pedidos
 */
function configurarEventosPedidos() {
  // Filtros de pedidos
  document
    .getElementById("filtro-metodo-pago")
    ?.addEventListener("change", cargarTablaPedidos);
  
  document
    .getElementById("filtro-estado-pedido")
    ?.addEventListener("change", cargarTablaPedidos);
  
  // Configurar filtros avanzados
  configurarFiltrosPedidos();
}


/**
 * Configura eventos relacionados con imágenes
 */

// DESPUÉS (función real y limpia)
function configurarEventosImagenes() {
  // Los listeners se conectan aquí, no en el HTML con onchange
  document
    .getElementById("product-images")
    ?.addEventListener("change", manejarImagenesRegistro);

  document
    .getElementById("update-images")
    ?.addEventListener("change", manejarImagenesActualizar);
}


/**
 * Configura eventos relacionados con usuarios
 */
function configurarEventosUsuarios() {
  // Configurar formulario de usuarios si existe
  const formUsuario = document.getElementById("form-usuario");
  if (formUsuario) {
    formUsuario.addEventListener("submit", async function (e) {
      e.preventDefault();
      await guardarUsuario(e);
    });
  }

  // Configurar botón nuevo usuario
  const btnNuevoUsuario = document.getElementById("btn-nuevo-usuario");
  if (btnNuevoUsuario) {
    btnNuevoUsuario.addEventListener("click", function () {
      if (!AuthService.isAdmin()) {
        alert("Acceso denegado: Se requieren permisos de administrador");
        return;
      }
      mostrarFormularioUsuario("nuevo");
    });
  }

  // Configurar botón cancelar usuario
  const btnCancelarUsuario = document.getElementById("btn-cancelar-usuario");
  if (btnCancelarUsuario) {
    btnCancelarUsuario.addEventListener("click", function () {
      document.getElementById("form-usuario-container").style.display = "none";
    });
  }
}

/**
 * Configura eventos del modal de confirmación
 */
function configurarEventosModal() {
  document
    .getElementById("btn-cancelar")
    ?.addEventListener("click", cerrarModal);
  
  document
    .getElementById("btn-confirmar")
    ?.addEventListener("click", confirmarEliminacion);
}

/**
 * Configura cálculos de precios en tiempo real
 */
function configurarCalculosPrecios() {
  // Para registro (solo admin)
  if (AuthService.isAdmin()) {
    const precioOriginal = document.getElementById("product-precio-original");
    const descuento = document.getElementById("product-descuento");
    const precioFinal = document.getElementById("product-precio-final");

    function calcularPrecioFinal() {
      const precio = parseFloat(precioOriginal.value) || 0;
      const desc = parseFloat(descuento.value) || 0;
      const precioConDescuento = precio - (precio * desc) / 100;
      precioFinal.value = precioConDescuento.toFixed(2);
    }

    if (precioOriginal && descuento && precioFinal) {
      precioOriginal.addEventListener("input", calcularPrecioFinal);
      descuento.addEventListener("input", calcularPrecioFinal);
    }
  }

  // Para actualizar (solo admin)
  if (AuthService.isAdmin()) {
    const updatePrecioOriginal = document.getElementById(
      "update-precio-original"
    );
    const updateDescuento = document.getElementById("update-discount");
    const updatePrecioActual = document.getElementById("update-precio-actual");

    if (updatePrecioOriginal && updateDescuento && updatePrecioActual) {
      function calcularPrecioActual() {
        const precio = parseFloat(updatePrecioOriginal.value) || 0;
        const desc = parseFloat(updateDescuento.value) || 0;
        const precioConDescuento = precio - (precio * desc) / 100;
        updatePrecioActual.value = precioConDescuento.toFixed(2);
      }

      updatePrecioOriginal.addEventListener("input", calcularPrecioActual);
      updateDescuento.addEventListener("input", calcularPrecioActual);
    }
  }
}

// Exportar funciones para uso global
window.configurarEventos = configurarEventos;
window.configurarCalculosPrecios = configurarCalculosPrecios;