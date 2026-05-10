// ========== CONFIGURACIÓN DE EVENTOS ==========

/**
 * Configura todos los eventos del dashboard
 */
function configurarEventos() {
  console.log("🔄 Configurando eventos...");

  // Logout
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        AuthService.logout();
      }
    });
  }

  // Productos (solo para admin)
  if (AuthService.isAdmin()) {
    configurarEventosProductos();
  }

  // Pedidos (todos los roles)
  configurarEventosPedidos();

  // Categorías (solo admin)
  if (AuthService.isAdmin()) {
    configurarEventosCategorias();
  }

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
  const refreshProductsBtn = document.getElementById("refreshProducts");
  if (refreshProductsBtn) {
    refreshProductsBtn.addEventListener("click", cargarProductos);
  }

  const formRegistrar = document.getElementById("form-registrar");
  if (formRegistrar) {
    formRegistrar.addEventListener("submit", registrarProducto);
  }

  const formActualizar = document.getElementById("form-actualizar");
  if (formActualizar) {
    formActualizar.addEventListener("submit", actualizarProducto);
  }

  const btnSearchUpdate = document.getElementById("btn-search-update");
  if (btnSearchUpdate) {
    btnSearchUpdate.addEventListener("click", buscarParaActualizar);
  }

  const btnLimpiarForm = document.getElementById("btn-limpiar-form");
  if (btnLimpiarForm) {
    btnLimpiarForm.addEventListener("click", limpiarFormularioActualizar);
  }

  const buscadorProductos = document.getElementById("buscador-productos");
  if (buscadorProductos) {
    let timeoutId;
    buscadorProductos.addEventListener("input", function () {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        filtrarProductos();
      }, 300);
    });
  }

  const searchUpdate = document.getElementById("search-update");
  if (searchUpdate) {
    searchUpdate.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarParaActualizar();
      }
    });
  }
}

/**
 * Configura eventos relacionados con pedidos
 */
function configurarEventosPedidos() {
  const filtroMetodoPago = document.getElementById("filtro-metodo-pago");
  if (filtroMetodoPago) {
    filtroMetodoPago.addEventListener("change", cargarTablaPedidos);
  }

  const filtroEstadoPedido = document.getElementById("filtro-estado-pedido");
  if (filtroEstadoPedido) {
    filtroEstadoPedido.addEventListener("change", cargarTablaPedidos);
  }

  // Configurar filtros de pedidos
  configurarFiltrosPedidos();
}


/**
 * Configura eventos relacionados con imágenes
 */
function configurarEventosImagenes() {
  const productImages = document.getElementById("product-images");
  if (productImages) {
    productImages.addEventListener("change", manejarImagenesRegistro);
  }

  const updateImages = document.getElementById("update-images");
  if (updateImages) {
    updateImages.addEventListener("change", manejarImagenesActualizar);
  }
}

/**
 * Configura eventos relacionados con usuarios
 */
function configurarEventosUsuarios() {
  const formUsuario = document.getElementById("form-usuario");
  if (formUsuario) {
    formUsuario.addEventListener("submit", function (e) {
      e.preventDefault();
      guardarUsuario(e);
    });
  }

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

  const btnCancelarUsuario = document.getElementById("btn-cancelar-usuario");
  if (btnCancelarUsuario) {
    btnCancelarUsuario.addEventListener("click", function () {
      const formUsuarioContainer = document.getElementById(
        "form-usuario-container"
      );
      if (formUsuarioContainer) {
        formUsuarioContainer.style.display = "none";
      }
    });
  }
}

/**
 * Configura eventos del modal
 */
function configurarEventosModal() {
  const btnCancelar = document.getElementById("btn-cancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", cerrarModal);
  }

  const btnConfirmar = document.getElementById("btn-confirmar");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", confirmarEliminacion);
  }
}

/**
 * Configura cálculos de precios en tiempo real
 */
function configurarCalculosPrecios() {
  // Para registro
  const precioOriginal = document.getElementById("product-precio-original");
  const descuento = document.getElementById("product-descuento");
  const precioFinal = document.getElementById("product-precio-final");

  if (precioOriginal && descuento && precioFinal) {
    const calcularPrecioFinal = () => {
      const precio = parseFloat(precioOriginal.value) || 0;
      const desc = parseFloat(descuento.value) || 0;
      const precioConDescuento = precio - (precio * desc) / 100;
      precioFinal.value = precioConDescuento.toFixed(2);
    };

    precioOriginal.addEventListener("input", calcularPrecioFinal);
    descuento.addEventListener("input", calcularPrecioFinal);
  }

  // Para actualizar
  const updatePrecioOriginal = document.getElementById(
    "update-precio-original"
  );
  const updateDescuento = document.getElementById("update-discount");
  const updatePrecioActual = document.getElementById("update-precio-actual");

  if (updatePrecioOriginal && updateDescuento && updatePrecioActual) {
    const calcularPrecioActual = () => {
      const precio = parseFloat(updatePrecioOriginal.value) || 0;
      const desc = parseFloat(updateDescuento.value) || 0;
      const precioConDescuento = precio - (precio * desc) / 100;
      updatePrecioActual.value = precioConDescuento.toFixed(2);
    };

    updatePrecioOriginal.addEventListener("input", calcularPrecioActual);
    updateDescuento.addEventListener("input", calcularPrecioActual);
  }
}

/**
 * Cierra el modal de confirmación
 */
function cerrarModal() {
  const modalConfirmacion = document.getElementById("modal-confirmacion");
  if (modalConfirmacion) {
    modalConfirmacion.style.display = "none";
  }
  window.productoAEliminar = null;
}

/**
 * Confirma la eliminación de un producto
 */
async function confirmarEliminacion() {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  if (!window.productoAEliminar) return;

  try {
    const response = await fetchConAuth(
      `${window.BACKEND_URL}/productos/${window.productoAEliminar}`,
      {
        method: "DELETE",
      }
    );

    if (!response) return;

    const result = await response.json();

    if (result.success) {
      alert("✅ Producto inhabilitado correctamente");
      await cargarProductos();
      actualizarDashboard();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    alert("Error al eliminar producto");
  }

  cerrarModal();
}

/**
 * Formatea una fecha a formato legible
 */
function formatearFecha(fechaString) {
  if (!fechaString) return "N/A";

  try {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-HN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.log("⚠️ Error al formatear fecha:", fechaString, e);
    return fechaString || "N/A";
  }
}

// ============================================
//     SISTEMA DE NOTIFICACIONES UNIFICADO PARA ADMIN
// ============================================

function mostrarNotificacionAdmin(tipo = 'info', mensaje = null) {
  // Eliminar notificaciones existentes
  const notificacionesExistentes = document.querySelectorAll('.carrito-notificacion');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  const config = {
    success: {
      icono: '<i class="fas fa-check-circle"></i>',
      defaultMsg: 'Operación completada exitosamente'
    },
    error: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      defaultMsg: 'Error al procesar la solicitud'
    },
    warning: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      defaultMsg: 'Verifica la información'
    },
    info: {
      icono: '<i class="fas fa-info-circle"></i>',
      defaultMsg: 'Información actualizada'
    }
  };
  
  const cfg = config[tipo] || config.info;
  const texto = mensaje || cfg.defaultMsg;
  
  const notificacion = document.createElement('div');
  notificacion.className = `carrito-notificacion ${tipo}`;
  notificacion.innerHTML = `${cfg.icono}<span>${texto}</span>`;
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    if (notificacion && notificacion.parentNode) {
      notificacion.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notificacion && notificacion.parentNode) {
          notificacion.remove();
        }
      }, 300);
    }
  }, 3000);
}

function mostrarNotificacionCargaAdmin(mensaje = 'Procesando...') {
  const notificacion = document.createElement('div');
  notificacion.className = 'carrito-notificacion info';
  notificacion.innerHTML = `<i class="fas fa-spinner fa-pulse"></i><span>${mensaje}</span>`;
  document.body.appendChild(notificacion);
  return notificacion;
}

function ocultarNotificacionCargaAdmin(notificacion) {
  if (notificacion && notificacion.parentNode) {
    notificacion.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }
}

// Modal de confirmación personalizado (reemplaza el confirm nativo)
function mostrarModalConfirmacion(opciones) {
  return new Promise((resolve) => {
    const modalHTML = `
      <div id="modalConfirmacionPersonalizado" class="modal-confirmacion-personalizado" style="display: flex;">
        <div class="modal-contenido-personalizado">
          <div class="modal-header-personalizado ${opciones.tipo || 'warning'}">
            <i class="fas ${opciones.icono || 'fa-question-circle'}"></i>
            <h3>${opciones.titulo || 'Confirmar'}</h3>
          </div>
          <div class="modal-body-personalizado">
            <p>${opciones.mensaje || '¿Estás seguro de realizar esta acción?'}</p>
          </div>
          <div class="modal-footer-personalizado">
            <button class="btn-cancelar" id="btnCancelarModal">${opciones.textoCancelar || 'Cancelar'}</button>
            <button class="btn-confirmar ${opciones.tipo || 'warning'}" id="btnConfirmarModal">${opciones.textoConfirmar || 'Confirmar'}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('modalConfirmacionPersonalizado');
    const btnConfirmar = document.getElementById('btnConfirmarModal');
    const btnCancelar = document.getElementById('btnCancelarModal');
    
    const cerrar = (resultado) => {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        modal.remove();
        resolve(resultado);
      }, 300);
    };
    
    btnConfirmar.onclick = () => cerrar(true);
    btnCancelar.onclick = () => cerrar(false);
    modal.onclick = (e) => {
      if (e.target === modal) cerrar(false);
    };
  });
}

// Exportar funciones para uso global
window.cerrarModal = cerrarModal;
window.formatearFecha = formatearFecha;
window.configurarEventos = configurarEventos;
window.configurarCalculosPrecios = configurarCalculosPrecios;
window.confirmarEliminacion = confirmarEliminacion;
