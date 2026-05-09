document.addEventListener("DOMContentLoaded", () => {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  inicializarCarrito();
  
  // 🔥 IMPORTANTE: Actualizar el badge del carrito
  actualizarContadorCarritoGlobal();

  // Verificar si hay productos con stock bajo al cargar
  setTimeout(() => {
    const productosStockBajo = carrito.filter(p => p.stock <= 3 && p.stock > 0);
    if (productosStockBajo.length > 0 && carrito.length > 0) {
      mostrarNotificacionCarrito('warning', 
        `Atención: ${productosStockBajo.length} producto(s) tienen stock limitado. ¡Apresúrate!`
      );
    }
  }, 500);

});

// ------------------ VARIABLES GLOBALES ------------------
let carrito = [];



/* Volver al catalogo */
document.getElementById("btn-seguir-Comprando").addEventListener("click", function () {
    window.location.href = "../Index.html"
  })

  document.getElementById("btn-seguir-Comprando2").addEventListener("click", function () {
    window.location.href = "../Index.html"
  })

// Función para actualizar el badge global (desde index.js)
function actualizarContadorCarritoGlobal() {
  const totalProductos = carrito.reduce((total, producto) => total + producto.cantidad, 0);
  
  // Actualizar en esta página
  const badgeLocal = document.querySelector('.carrito-badge-local');
  if (badgeLocal) {
    badgeLocal.textContent = totalProductos;
    badgeLocal.style.display = totalProductos > 0 ? 'flex' : 'none';
  }
  
  // También actualizar en localStorage para que index.js lo vea
  localStorage.setItem('carrito_total', totalProductos);
  
}

// ------------------ INICIALIZAR CARRITO ------------------
function inicializarCarrito() {
  renderizarCarrito();
  configurarEventos();
  actualizarResumen();
}

// ------------------ RENDERIZAR CARRITO ------------------
function renderizarCarrito() {
  const listaProductos = document.getElementById("lista-carrito") || 
                        document.getElementById("listaProductos");
  const carritoVacio = document.getElementById("carritoVacio");
  
  if (!listaProductos) {
    console.error("No se encontró el elemento para listar productos");
    return;
  }
  
  // Limpiar lista
  listaProductos.innerHTML = "";
  
  // Verificar si el carrito está vacío
  if (carrito.length === 0) {
    if (carritoVacio) carritoVacio.style.display = "block";
    localStorage.removeItem("carrito");
    actualizarContadorCarritoGlobal();
    return;
  }
  
  // Si hay productos, ocultar mensaje
  if (carritoVacio) carritoVacio.style.display = "none";
  
  // Crear elementos para cada producto
  carrito.forEach((producto, index) => {
    const elemento = crearElementoProducto(producto, index);
    listaProductos.appendChild(elemento);
  });
}

// ------------------ CREAR ELEMENTO DE PRODUCTO MEJORADO ------------------
function crearElementoProducto(producto, index) {
  const div = document.createElement("div");
  div.className = "producto-item";
  div.dataset.id = producto.id;
  div.dataset.index = index;
  
  // Si el producto no tiene categoría o descripción, usar valores por defecto
  const categoria = producto.categoria || "General";
  const descripcion = producto.descripcion || "Producto de calidad";
  
  div.innerHTML = `
    <div class="producto-imagen">
      <img src="${producto.imagen || 'https://via.placeholder.com/100x100?text=Sin+Imagen'}" 
           alt="${producto.nombre}"
           onerror="this.src='https://via.placeholder.com/100x100?text=Sin+Imagen'">
    </div>
    
    <div class="producto-info">
      <div class="producto-nombre">${producto.nombre}</div>
      <div class="producto-detalles">
        <span>Categoría: ${categoria}</span>
      </div>
      <div class="producto-precio-unitario">
        HNL ${producto.precio.toFixed(2)} c/u
      </div>
      <div class="producto-subtotal">
        Subtotal: <strong>HNL ${(producto.precio * producto.cantidad).toFixed(2)}</strong>
      </div>
    </div>
    
    <div class="producto-cantidad">
      <div class="cantidad-control">
        <button class="cantidad-btn btn-restar" data-id="${producto.id}" 
                ${producto.cantidad <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <i class="fas fa-minus"></i>
        </button>
        
        <input type="number" 
               class="cantidad-input"
               value="${producto.cantidad}"
               min="1"
               max="${producto.stock}"
               data-id="${producto.id}"
               readonly>
        
        <button class="cantidad-btn btn-sumar" data-id="${producto.id}"
                ${producto.cantidad >= producto.stock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <i class="fas fa-plus"></i>
        </button>
      </div>
      
      <div class="cantidad-stock ${producto.stock <= 3 ? 'stock-bajo' : ''}">
        Disponible: ${producto.stock}
        ${producto.stock <= 3 ? ' (¡Últimas unidades!)' : ''}
      </div>
    </div>
    
    <div class="producto-eliminar">
      <button class="btn-eliminar" data-id="${producto.id}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  return div;
}


// ------------------ CONFIGURAR EVENTOS ------------------
function configurarEventos() {
  // Delegación de eventos para mejor performance
  document.addEventListener("click", function (e) {
    // Eliminar producto
    if (e.target.closest(".btn-eliminar")) {
      const btn = e.target.closest(".btn-eliminar");
      const id = btn.dataset.id;
      eliminarProducto(id);
    }
    
    // Aumentar cantidad
    if (e.target.closest(".btn-sumar")) {
      const btn = e.target.closest(".btn-sumar");
      const id = btn.dataset.id;
      cambiarCantidad(id, 1);
    }
    
    // Disminuir cantidad
    if (e.target.closest(".btn-restar")) {
      const btn = e.target.closest(".btn-restar");
      const id = btn.dataset.id;
      cambiarCantidad(id, -1);
    }
  });
  
  // Evento para inputs de cantidad (por si se edita manualmente)
  document.addEventListener("input", function (e) {
    if (e.target.classList.contains("cantidad-input")) {
      const id = e.target.dataset.id;
      const nuevaCantidad = parseInt(e.target.value) || 1;
      
      if (nuevaCantidad < 1) {
        e.target.value = 1;
        return;
      }
      
      actualizarCantidadProducto(id, nuevaCantidad);
    }
  });
  
  // Evento para continuar al pago
  const btnPago = document.getElementById("continuarPago");
  if (btnPago) {
    btnPago.addEventListener("click", continuarPago);
  }
  
  // Evento para vaciar carrito
  const btnVaciar = document.getElementById("vaciarCarrito");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", vaciarCarrito);
  }
}

// Reemplaza la función 'eliminarProducto' actual (línea ~165-180)
function eliminarProducto(id) {
  // Obtener nombre del producto antes de eliminar
  const producto = carrito.find((p) => p.id === id);
  const nombreProducto = producto ? producto.nombre : 'Producto';
  
  if (!confirm(`¿Estás seguro de eliminar "${nombreProducto}" del carrito?`)) {
    return;
  }
  
  // Filtrar el producto a eliminar
  carrito = carrito.filter((producto) => producto.id !== id);
  
  // Actualizar localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));
  
  // Volver a renderizar
  renderizarCarrito();
  actualizarResumen();
  actualizarContadorCarritoGlobal();
  
  // Usar nuevo sistema de notificaciones
  mostrarNotificacionCarrito('success', `✓ ${nombreProducto} eliminado del carrito`);
}

// ------------------ CAMBIAR CANTIDAD ------------------
function cambiarCantidad(id, delta) {
  const producto = carrito.find((p) => p.id === id);
  
  if (!producto) {
    console.error("Producto no encontrado en carrito:", id);
    return;
  }
  
  const nuevaCantidad = producto.cantidad + delta;
  
  // Validar límites
  if (nuevaCantidad < 1) {
    mostrarNotificacionCarrito('warning', '⚠️ La cantidad mínima es 1');
    return;
  }
  
  if (nuevaCantidad > producto.stock) {
    mostrarNotificacionCarrito('warning', `⚠️ Stock limitado. Máximo disponible: ${producto.stock} unidades`);
    return;
  }
  
  actualizarCantidadProducto(id, nuevaCantidad);
}

// ------------------ ACTUALIZAR CANTIDAD DE PRODUCTO ------------------
function actualizarCantidadProducto(id, nuevaCantidad) {
  // Buscar producto en carrito
  const producto = carrito.find((p) => p.id === id);
  
  if (!producto) return;

  const cantidadAnterior = producto.cantidad;
  
  // Actualizar cantidad
  producto.cantidad = nuevaCantidad;
  
  // Actualizar localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));
  
  // Actualizar visualmente el input
  const input = document.querySelector(`.cantidad-input[data-id="${id}"]`);
  if (input) {
    input.value = nuevaCantidad;
  }
  
  // Actualizar botones
  const btnRestar = document.querySelector(`.btn-restar[data-id="${id}"]`);
  const btnSumar = document.querySelector(`.btn-sumar[data-id="${id}"]`);
  
  if (btnRestar) {
    btnRestar.disabled = nuevaCantidad <= 1;
    btnRestar.style.opacity = nuevaCantidad <= 1 ? "0.5" : "1";
    btnRestar.style.cursor = nuevaCantidad <= 1 ? "not-allowed" : "pointer";
  }
  
  if (btnSumar) {
    btnSumar.disabled = nuevaCantidad >= producto.stock;
    btnSumar.style.opacity = nuevaCantidad >= producto.stock ? "0.5" : "1";
    btnSumar.style.cursor = nuevaCantidad >= producto.stock ? "not-allowed" : "pointer";
  }
  
  // Actualizar subtotal del producto
  const productoElement = document.querySelector(`.producto-item[data-id="${id}"]`);
  if (productoElement) {
    const subtotalElement = productoElement.querySelector('.producto-subtotal');
    if (subtotalElement) {
      subtotalElement.innerHTML = `Subtotal: <strong>HNL ${(producto.precio * nuevaCantidad).toFixed(2)}</strong>`;
    }
  }
  
  // Actualizar resumen general
  actualizarResumen();
  actualizarContadorCarritoGlobal();
  
  // Mostrar notificación solo si realmente cambió
  if (cantidadAnterior !== nuevaCantidad) {
    if (nuevaCantidad > cantidadAnterior) {
      mostrarNotificacionCarrito('success', `✓ Cantidad aumentada a ${nuevaCantidad} unidades`);
    } else {
      mostrarNotificacionCarrito('info', `Cantidad reducida a ${nuevaCantidad} unidades`);
    }
  }
}

// ------------------ VACIAR CARRITO ------------------
function vaciarCarrito() {
  if (carrito.length === 0) {
    mostrarNotificacionCarrito('success', 'Carrito ya está vacío');
    return;
  }
  
  if (!confirm("¿Estás seguro de vaciar todo el carrito?")) {
    return;
  }
  
  carrito = [];
  localStorage.removeItem("carrito");
  localStorage.removeItem("carrito_total");
  
  renderizarCarrito();
  actualizarResumen();
  actualizarContadorCarritoGlobal();
  
  mostrarNotificacionCarrito('success', '🗑️ Carrito vaciado correctamente');
}

// ------------------ ACTUALIZAR RESUMEN ------------------
function actualizarResumen() {
  // Calcular subtotal
  const subtotal = carrito.reduce((total, producto) => {
    return total + (producto.precio * producto.cantidad);
  }, 0);
  
  
  // Calcular impuestos (15% en Honduras)
  const impuestos = subtotal * 0.15;
  
  // Calcular total
  const total = subtotal + impuestos;
  
  // Actualizar elementos en el DOM
  const elementos = {
    "subtotal": `HNL ${subtotal.toFixed(2)}`,
    "impuestos": `HNL ${impuestos.toFixed(2)}`,
    "total": `HNL ${total.toFixed(2)}`
  };
  
  Object.keys(elementos).forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = elementos[id];
    }
  });
  
  // Actualizar contador de productos
  const contadorProductos = document.getElementById("contadorProductos");
  if (contadorProductos) {
    const totalProductos = carrito.reduce((total, p) => total + p.cantidad, 0);
    contadorProductos.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;
  }
}

// ------------------ CONTINUAR AL PAGO ------------------
function continuarPago() {
  if (carrito.length === 0) {
    mostrarNotificacionCarrito('warning', 'No hay productos en el carrito');
    return;
  }
  
  // Verificar stock antes de proceder
  const sinStock = carrito.filter(p => p.cantidad > p.stock);
  if (sinStock.length > 0) {
    mostrarNotificacionCarrito('error', 'Algunos productos no tienen suficiente stock');
    return;
  }
   // Verificar stock antes de proceder
  const productosSinStock = carrito.filter(p => p.cantidad > p.stock);
  if (productosSinStock.length > 0) {
    const nombresProductos = productosSinStock.map(p => p.nombre).join(', ');
    mostrarNotificacionCarrito('error', ` Productos sin stock suficiente: ${nombresProductos}`);
    return;
  }
  
  // Mostrar notificación de carga
  const notifCarga = mostrarNotificacionCarga('🔄 Procesando pedido...');
  
   // Verificar productos con stock bajo
  const productosStockBajo = carrito.filter(p => p.stock <= 3 && p.stock > 0);
  if (productosStockBajo.length > 0) {
    setTimeout(() => {
      ocultarNotificacionCarga(notifCarga);
      //mostrarNotificacionCarrito('warning', `Algunos productos tienen stock limitado: ${productosStockBajo.map(p => p.nombre).join(', ')}`);
    }, 500);
  }

  // Guardar carrito en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));
  
  console.log("🛒 Datos guardados para facturación:", {
    carrito: carrito.length,
  });
  
  // Mostrar notificación de éxito y redirigir
  setTimeout(() => {
    ocultarNotificacionCarga(notifCarga);
    mostrarNotificacionCarrito('success', `✅ Redirigiendo a facturación... (${carrito.length} productos)`);
    
    // Redirigir después de 1 segundo
    setTimeout(() => {
      window.location.href = "../Pages/facturacion_pago.html";
    }, 1000);
  }, 800);
}


// ========== SISTEMA DE NOTIFICACIONES UNIFICADO ==========
function mostrarNotificacionCarrito(tipo = 'info', mensaje = null) {
  // Eliminar notificaciones existentes para evitar acumulación
  const notificacionesExistentes = document.querySelectorAll('.carrito-notificacion');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  // Mapeo de tipos a configuraciones
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
  
  // Crear notificación
  const notificacion = document.createElement('div');
  notificacion.className = `carrito-notificacion ${tipo}`;
  notificacion.innerHTML = `${cfg.icono}<span>${texto}</span>`;
  
  document.body.appendChild(notificacion);
  
  // Auto-eliminar después de 3 segundos
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

// Función para notificaciones de carga (operaciones asíncronas)
function mostrarNotificacionCarga(mensaje = 'Procesando...') {
  const notificacion = document.createElement('div');
  notificacion.className = 'carrito-notificacion info';
  notificacion.innerHTML = `<i class="fas fa-spinner fa-pulse"></i><span>${mensaje}</span>`;
  document.body.appendChild(notificacion);
  return notificacion;
}

function ocultarNotificacionCarga(notificacion) {
  if (notificacion && notificacion.parentNode) {
    notificacion.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }
}
