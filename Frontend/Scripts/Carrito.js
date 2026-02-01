document.addEventListener("DOMContentLoaded", () => {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  inicializarCarrito();
  
  // 🔥 IMPORTANTE: Actualizar el badge del carrito
  actualizarContadorCarritoGlobal();
});

// ------------------ VARIABLES GLOBALES ------------------
let carrito = [];
let costo_envio = parseFloat(localStorage.getItem("costo_envio")) || 0;



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
  configurarSelectEnvio();
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
        <span class="producto-desc">${descripcion.substring(0, 60)}${descripcion.length > 60 ? '...' : ''}</span>
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
  
  // Evento para envío
  const envio = document.getElementById("tipoEnvio");
  const opcion1 = document.getElementById("Recoger");
  const opcion2 = document.getElementById("Envio-estandar");
  const opcion3 = document.getElementById("Envio-express");


  if (envio) {
    envio.addEventListener("change", actualizarResumen);
  }
  
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

// ------------------ ELIMINAR PRODUCTO ------------------
function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto del carrito?")) {
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
  
  mostrarMensaje("Producto eliminado del carrito", "success");
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
    mostrarMensaje("La cantidad mínima es 1", "warning");
    return;
  }
  
  if (nuevaCantidad > producto.stock) {
    mostrarMensaje(`No hay más unidades disponibles. Máximo: ${producto.stock}`, "warning");
    return;
  }
  
  actualizarCantidadProducto(id, nuevaCantidad);
}

// ------------------ ACTUALIZAR CANTIDAD DE PRODUCTO ------------------
function actualizarCantidadProducto(id, nuevaCantidad) {
  // Buscar producto en carrito
  const producto = carrito.find((p) => p.id === id);
  
  if (!producto) return;
  
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
  
  mostrarMensaje(`Cantidad actualizada a ${nuevaCantidad}`, "info");
}

// ------------------ VACIAR CARRITO ------------------
function vaciarCarrito() {
  if (carrito.length === 0) {
    mostrarMensaje("El carrito ya está vacío", "info");
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
  
  mostrarMensaje("Carrito vaciado correctamente", "success");
}

// ------------------ ACTUALIZAR RESUMEN ------------------
function actualizarResumen() {
  // Calcular subtotal
  const subtotal = carrito.reduce((total, producto) => {
    return total + (producto.precio * producto.cantidad);
  }, 0);
  
  // Obtener costo de envío del select
  const envioSelect = document.getElementById("tipoEnvio");
  if (envioSelect) {
    // Actualizar variable global con el valor seleccionado
    costo_envio = parseFloat(envioSelect.value) || 0;
    
    // Guardar en localStorage para pasarlo a facturación
    localStorage.setItem("costo_envio", costo_envio);
    
    console.log("📦 Costo de envío actualizado:", costo_envio, "tipo:", envioSelect.options[envioSelect.selectedIndex]?.text);
  }
  
  // Calcular impuestos (15% en Honduras)
  const impuestos = subtotal * 0.15;
  
  // Calcular total
  const total = subtotal + costo_envio + impuestos;
  
  // Actualizar elementos en el DOM
  const elementos = {
    "subtotal": `HNL ${subtotal.toFixed(2)}`,
    "impuestos": `HNL ${impuestos.toFixed(2)}`,
    "envio": `HNL ${costo_envio.toFixed(2)}`,
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
    mostrarMensaje("No hay productos en el carrito", "warning");
    return;
  }
  
  // Verificar stock antes de proceder
  const sinStock = carrito.filter(p => p.cantidad > p.stock);
  if (sinStock.length > 0) {
    mostrarMensaje("Algunos productos no tienen suficiente stock", "error");
    return;
  }
  
  // Obtener tipo de envío seleccionado
  const envioSelect = document.getElementById("tipoEnvio");
  let tipoEnvioTexto = "Recoger en tienda";
  
  if (envioSelect) {
    const opcionSeleccionada = envioSelect.options[envioSelect.selectedIndex];
    tipoEnvioTexto = opcionSeleccionada ? opcionSeleccionada.text : "Recoger en tienda";
    
    // Guardar también el tipo de envío para facturación
    localStorage.setItem("tipo_envio", tipoEnvioTexto);
  }
  
  // Mostrar mensaje con el tipo de envío
  mostrarMensaje(`Redirigiendo a facturación (${tipoEnvioTexto})...`, "success");
  
  // Guardar carrito y costo de envío en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));
  localStorage.setItem("costo_envio", costo_envio.toString());
  
  console.log("🛒 Datos guardados para facturación:", {
    carrito: carrito.length,
    costo_envio: costo_envio,
    tipo_envio: tipoEnvioTexto
  });
  
  // Redirigir después de 1 segundo
  setTimeout(() => {
    window.location.href = "../Pages/facturacion_pago.html";
  }, 1000);
}

function configurarSelectEnvio() {
  const envioSelect = document.getElementById("tipoEnvio");
  const opcion1 = document.getElementById("Recoger");
  const opcion2 = document.getElementById("Envio-estandar");
  const opcion3 = document.getElementById("Envio-express");
  
  if (envioSelect) {
    // Configurar valores para cada opción
    if (opcion1) opcion1.value = "0";
    if (opcion2) opcion2.value = "670";
    if (opcion3) opcion3.value = "1400";
    
    // Establecer valor por defecto si no hay uno guardado
    if (costo_envio === 0) {
      envioSelect.value = "0"; // Recoger en tienda por defecto
    } else {
      envioSelect.value = costo_envio.toString();
    }
    
    // Evento para actualizar cuando cambia la selección
    envioSelect.addEventListener("change", function() {
      console.log("🔄 Envío cambiado a:", this.value, "opción:", this.options[this.selectedIndex]?.text);
      costo_envio = parseFloat(this.value) || 0;
      localStorage.setItem("costo_envio", costo_envio.toString());
      actualizarResumen();
    });
    
    // Llamar a actualizarResumen inicialmente
    actualizarResumen();
  }
}

// ------------------ MENSAJES ------------------
function mostrarMensaje(mensaje, tipo = "info") {
  // Remover mensajes anteriores
  const mensajesAnteriores = document.querySelectorAll('.mensaje-flotante');
  mensajesAnteriores.forEach(msg => msg.remove());
  
  // Crear nuevo mensaje
  const div = document.createElement("div");
  div.className = `mensaje-flotante mensaje-${tipo}`;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${tipo === 'success' ? '#2ecc71' : 
                 tipo === 'error' ? '#e74c3c' : 
                 tipo === 'warning' ? '#f39c12' : '#3498db'};
    color: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Agregar icono según tipo
  const icono = tipo === 'success' ? 'fa-check-circle' :
                tipo === 'error' ? 'fa-exclamation-circle' :
                tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  div.innerHTML = `<i class="fas ${icono}"></i> ${mensaje}`;
  
  document.body.appendChild(div);
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    div.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

// Agregar estilos CSS para animaciones
if (!document.querySelector('#estilos-mensajes')) {
  const estilo = document.createElement('style');
  estilo.id = 'estilos-mensajes';
  estilo.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .stock-bajo {
      color: #e74c3c;
      font-weight: bold;
    }
    
    .producto-subtotal {
      margin-top: 8px;
      font-size: 14px;
      color: #2c3e50;
    }
    
    .producto-desc {
      font-size: 13px;
      color: #7f8c8d;
      margin-top: 4px;
    }
    
    .cantidad-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
    }
  `;
  document.head.appendChild(estilo);
}