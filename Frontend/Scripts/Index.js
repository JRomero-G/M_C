// ========== CONFIGURACIÓN ==========
//const BACKEND_URL = "https://m-c-h5or.onrender.com/api"; /*URL del backend en linea */
let productosCatalogo = [];
let galeriaImagenes = [];
let indice = 0;

// ========== CARGAR PRODUCTOS DESDE BACKEND ==========
async function cargarProductosCatalogo() {
  try {
    console.log("🔄 Cargando productos para catálogo...");

    const response = await fetch(`${BACKEND_URL}/productos/catalogo`);
    const result = await response.json();

    if (result.success && result.productos.length > 0) {
      productosCatalogo = result.productos.filter((p) => p.activo !== false);
      console.log(`✅ ${productosCatalogo.length} productos cargados`);
      renderizarProductos(productosCatalogo);
      configurarFiltros();
    } else {
      console.warn(" No hay productos activos en el catálogo");
      document.querySelector(".product-grid").innerHTML = `
        <div class="no-products">
          <i class="fas fa-box-open fa-3x"></i>
          <h3>No hay productos disponibles</h3>
          <p>Pronto tendremos nuevos muebles para ti</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    document.querySelector(".product-grid").innerHTML = `
      <div class="error-products">
        <i class="fas fa-exclamation-triangle fa-3x"></i>
        <h3>Error al cargar productos</h3>
        <p>Intenta recargar la página</p>
      </div>
    `;
  }
}

// ========== RENDERIZAR PRODUCTOS EN HTML ==========
function renderizarProductos(productos) {
  const grid = document.querySelector(".product-grid");
  grid.innerHTML = "";

  if (productos.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-search fa-3x"></i>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otros filtros de búsqueda</p>
      </div>
    `;
    return;
  }

  productos.forEach((producto) => {
    const tieneDescuento = producto.descuento > 0;
    const precioFinal = producto.precio_final || producto.precio_original;
    const precioAnterior = producto.precio_original;
    const porcentajeDescuento = producto.descuento
      ? Math.round(producto.descuento)
      : 0;

    // Determinar el tipo de inventario
    const tipoInventario = producto.tipo_inventario || "serie"; // Por defecto "serie" si no viene especificado
    const esProductoUnico = tipoInventario === "unico";

    // Obtener primera imagen como thumbnail
    const imagenPrincipal =
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes[0].url
        : "https://via.placeholder.com/300x200?text=Sin+Imagen";

    // Preparar todas las imágenes para la galería
    const imagenesGaleria =
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes.map((img) => img.url)
        : ["https://via.placeholder.com/800x600?text=Sin+Imagen"];

    // Crear tarjeta de producto
    const tarjeta = document.createElement("section");
    tarjeta.className = "product-tarjeta";
    tarjeta.setAttribute("data-id", producto._id);
    tarjeta.setAttribute("data-precio", precioFinal);
    tarjeta.setAttribute("data-nombre", producto.nombre);
    tarjeta.setAttribute("data-categoria", producto.categoria || "General");
    tarjeta.id = tieneDescuento ? "Trajeta-descuento" : "tarjeta-normal";

    // Construir la sección de badges según el tipo de inventario
    let badgesSection = '';
    
    if (esProductoUnico) {
      // Productos únicos: solo badge de "PIEZA ÚNICA"
      badgesSection = `
        <div class="unico-badge">PIEZA ÚNICA</div>
      `;
    } else {
      // Productos tipo "serie": badges normales
      const agotadoBadge = producto.stock <= 0 ? '<div class="agotado-badge">AGOTADO</div>' : '';
      const bajoStockBadge = (producto.stock > 0 && producto.stock <= 3) ? '<div class="bajo-stock-badge">ÚLTIMAS UNIDADES</div>' : '';
      badgesSection = agotadoBadge + bajoStockBadge;
    }

    // Construir la sección de cantidad/mensaje según el tipo de inventario
    let cantidadSection = '';
    
    if (tipoInventario === "unico") {
      // Para productos únicos: mostrar mensaje centrado en lugar del selector de cantidad
      cantidadSection = `
        <section class="producto-unico-mensaje">
          <i class="fas fa-star"></i> Pieza de Diseño Único
        </section>
      `;
    } else {
      // Para productos tipo "serie": mostrar selector de cantidad normal
      cantidadSection = `
        <section class="product-cantidad" ${producto.stock <= 0 ? 'style="display:none;"' : ""}>
          <button class="cantidad-btn" onclick="cambiarCantidad(this, -1)">
            <i class="fas fa-minus"></i>
          </button>
          <input type="number" value="1" min="1" max="${producto.stock}" readonly class="cantidad-input" />
          <button class="cantidad-btn" onclick="cambiarCantidad(this, 1)" ${producto.stock <= 1 ? "disabled" : ""}>
            <i class="fas fa-plus"></i>
          </button>
        </section>
      `;
    }

     // Construir la sección de stock según el tipo de inventario
    let stockSection = '';
    if (esProductoUnico) {
      // Productos únicos: mensaje personalizado sin número de unidades
      stockSection = `

      `;
    } else {
      // Productos tipo "serie": mostrar número de unidades disponibles
      stockSection = `
        <section class="product-stock">
          <i class="fas fa-boxes"></i> 
          <span class="${producto.stock > 0 ? "stock-disponible" : "stock-agotado"}">
            ${producto.stock > 0
              ? `${producto.stock} unidades disponibles`
              : "Agotado"}
          </span>
        </section>
      `;
    }
    
    tarjeta.innerHTML = `
      <section class="product-image-container">
        <img src="${imagenPrincipal}" alt="${producto.nombre}" loading="lazy" />
        <section class="product-overlay" onclick="abrirGaleria(${JSON.stringify(
          imagenesGaleria
        ).replace(/"/g, "'")})">
          <i class="fas fa-images"></i> Ver Galería (${
            producto.imagenes?.length || 0
          })
        </section>
        ${badgesSection}
      </section>
      <section class="product-informacion">
        <h3 class="product-nombre">${producto.nombre}</h3>
        <p class="product-categoria">
          <i class="fas fa-tag"></i> ${producto.categoria || "General"}
        </p>
        <p class="product-descripcion-corta">
          ${
            producto.descripcion
              ? producto.descripcion.substring(0, 100) + "..."
              : "Producto de calidad"
          }
        </p>
        <a class="btn-ver-detalles" onclick="verDetallesCompletos('${producto._id}')">
          <i class="fas fa-eye"></i> Ver detalles completos
        </a>
        
        <section class="product-precio">
          ${
            tieneDescuento
              ? `
            <span class="product-price-anterior">
              <s>HNL ${precioAnterior.toFixed(2)}</s> ${
              tieneDescuento
                ? `<span class="discount-badge">-${porcentajeDescuento}%</span>`
                : ""
            }
            </span>
          `
              : ""
          }
          <span class="product-price-actual">
            HNL ${precioFinal.toFixed(2)}
          
          </span>
        </section>

        ${stockSection}

        ${cantidadSection}

        <!-- ACCIONES -->
        <section class="product-acciones">
          <a class="btn-carrito" ${
            producto.stock <= 0
              ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
              : ""
          } 
            onclick="agregarAlCarrito('${
              producto._id
            }', ${precioFinal}, this)">
            <i class="fas fa-shopping-cart"></i> 
            ${producto.stock > 0 ? "Agregar al Carrito" : "Agotado"}
          </a>
          <a class="btn-comprar" ${
            producto.stock <= 0
              ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
              : ""
          }
            onclick="comprarAhora('${producto._id}', ${precioFinal})">
            <i class="fas fa-bolt"></i> Comprar ahora
          </a>
        </section>
      </section>
    `;

    grid.appendChild(tarjeta);
  });
}

// ========== FUNCIONES DEL CARRITO ==========
function agregarAlCarrito(productoId, precio, elementoBtn, redirigir = false) {
  const contenedor = elementoBtn.closest(".product-tarjeta");

  // Determinar si es producto único por el atributo o por la presencia del mensaje
  const esProductoUnico = contenedor.querySelector('.producto-unico-mensaje') !== null ||
                          contenedor.getAttribute('data-tipo-inventario') === 'unico';
  
  let cantidad = 1;

  if (!esProductoUnico) {
    // Para productos de serie, obtener la cantidad seleccionada
    const inputCantidad = contenedor.querySelector(".cantidad-input");
    cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
  } else {
    // Para productos únicos, la cantidad siempre es 1
    cantidad = 1;
  }

  // Obtener datos del producto
  const producto = productosCatalogo.find((p) => p._id === productoId);

  if (!producto) {
    mostrarNotificacionCarrito('error', 'Producto no encontrado');
    return;
  }

    // USAR LA FUNCIÓN DE VALIDACIÓN
  const validacion = validarProductoAntesDeAgregar(producto, cantidad);
  
  if (!validacion.valido) {
    mostrarNotificacionCarrito('warning', `${validacion.mensaje}`);
    return;
  }

  // Si la cantidad solicitada es mayor que la máxima permitida, ajustar
  if (cantidad > validacion.cantidadMaxima) {
    cantidad = validacion.cantidadMaxima;
    mostrarNotificacionCarrito('warning', `Cantidad ajustada a ${cantidad} unidades disponibles`);
  }

  // Obtener carrito actual de localStorage
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // Buscar si el producto ya está en el carrito
  const itemExistente = carrito.find((item) => item.id === productoId);

  if (itemExistente) {
    if (esProductoUnico) {
      mostrarNotificacionCarrito('warning', 'Esta pieza única ya está en tu carrito');
      return;
    }

    // Actualizar cantidad si ya existe (Solo productos de serie)
    if (itemExistente.cantidad + cantidad > producto.stock) {
      mostrarNotificacionCarrito('warning', `Stock insuficiente. Máximo: ${producto.stock} - En carrito: ${itemExistente.cantidad}`);
      return;
    }
    itemExistente.cantidad += cantidad;
  } else {
    // Agregar nuevo producto al carrito CON TODOS LOS DATOS NECESARIOS
    carrito.push({
      id: productoId,
      nombre: producto.nombre,
      precio: precio,
      cantidad: cantidad,
      imagen:
        producto.imagenes?.[0]?.url ||
        "https://via.placeholder.com/100x100?text=Sin+Imagen",
      stock: producto.stock,
      categoria: producto.categoria || "General",
      descripcion: producto.descripcion || "Producto de calidad",
      tipo_inventario: esProductoUnico ? "unico" : "serie", // Guardamos el tipo
      esPiezaUnica: esProductoUnico // Flag adicional para fácil identificación
    });
  }

  // Guardar en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));

  // Feedback visual mejorado
  //const iconoOriginal = elementoBtn.querySelector("i")?.className || "fas fa-shopping-cart";
  
  const textoOriginal = elementoBtn.innerHTML;


  if (esProductoUnico) {
    elementoBtn.innerHTML = '<i class="fas fa-gem"></i> ¡Pieza Única Agregada!';
    mostrarNotificacionCarrito('success', '✨ ¡Pieza única agregada al carrito! ✨');
  } else {
    elementoBtn.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
    mostrarNotificacionCarrito('success', `✓ ${producto.nombre} agregado al carrito`);
  }

  elementoBtn.style.backgroundColor = "#2ecc71";
  elementoBtn.style.color = "white";

  setTimeout(() => {
    elementoBtn.innerHTML = textoOriginal;
    elementoBtn.style.backgroundColor = "";
    elementoBtn.style.color = "";
  }, 1500);

  // Actualizar contador del carrito
  actualizarContadorCarrito();

  console.log(`🛒 Producto agregado: ${producto.nombre} x${cantidad}`);

  // Si se solicita redirección, ir al carrito
  if (redirigir) {
    setTimeout(() => {
      window.location.href = "./Pages/Carrito.html";
    }, 1500);
  }
}

function comprarAhora(productoId, precio) {
  console.log("⚡ Comprar ahora - Producto ID:", productoId);

  const producto = productosCatalogo.find((p) => p._id === productoId);
  if (!producto) {
    mostrarNotificacionCarrito('error', '❌ Producto no encontrado');
    return;
  }
  
  // Determinar si es producto único
  const esProductoUnico = producto.tipo_inventario === "unico";

  // Obtener contenedor del producto para leer la cantidad seleccionada
  const tarjeta = document.querySelector(`.product-tarjeta[data-id="${productoId}"]`) ||
                  document.querySelector(`.product-tarjeta`);

  let cantidad = 1;
  if (!esProductoUnico && tarjeta) {
    const inputCantidad = tarjeta.querySelector(".cantidad-input");
    cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
  }

  // Validar stock
  if (producto.stock < cantidad) {
    mostrarNotificacionCarrito('warning', `⚠️ Stock limitado: solo ${producto.stock} unidades disponibles`);
    return;
  }

  // Para productos únicos, limitar a 1
  if (esProductoUnico && cantidad > 1) {
    cantidad = 1;
  }

  // Crear objeto de compra directa (NO modifica el carrito existente)
  const compraDirecta = {
    tipo: "compra_directa",
    producto: {
      id: productoId,
      nombre: producto.nombre,
      precio: precio,
      cantidad: cantidad,
      imagen: producto.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
      stock: producto.stock,
      categoria: producto.categoria || "General",
      descripcion: producto.descripcion || "Producto de calidad",
      tipo_inventario: esProductoUnico ? "unico" : "serie",
      esPiezaUnica: esProductoUnico
    },
    timestamp: Date.now()
  };

  // Guardar compra directa en localStorage (separado del carrito)
  localStorage.setItem("compra_directa", JSON.stringify(compraDirecta));
  
  // También guardar como carrito temporal para facturación
  const carritoDirecto = [{
    id: productoId,
    nombre: producto.nombre,
    precio: precio,
    cantidad: cantidad,
    imagen: producto.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
    stock: producto.stock,
    categoria: producto.categoria || "General",
    descripcion: producto.descripcion || "Producto de calidad",
    tipo_inventario: esProductoUnico ? "unico" : "serie",
    esPiezaUnica: esProductoUnico
  }];
  
  localStorage.setItem("carrito", JSON.stringify(carritoDirecto));

  mostrarNotificacionCarrito('success', `🛍️ Redirigiendo a facturación...`);
  
  // Redirigir directamente a facturación
  setTimeout(() => {
    window.location.href = "./Pages/facturacion_pago.html";
  }, 500);
}

function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const totalProductos = carrito.length;

  const badge = document.querySelector(".carrito-badge");
  if (badge) {
    badge.textContent = totalProductos;
    badge.style.display = totalProductos > 0 ? "flex" : "none";
  }
}

// Función para validar que todos los productos del carrito respeten el stock disponible
function validarCarritoCompleto() {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  let modificado = false;
  
  // Agrupar por ID para detectar duplicados
  const productosPorId = {};
  carrito.forEach(item => {
    if (!productosPorId[item.id]) {
      productosPorId[item.id] = [];
    }
    productosPorId[item.id].push(item);
  });
  
  // Verificar cada producto agrupado
  for (const [id, items] of Object.entries(productosPorId)) {
    const primerItem = items[0];
    const esPiezaUnica = primerItem?.tipo_inventario === "unico" || primerItem?.esPiezaUnica === true;
    
    // Buscar el producto actualizado en el catálogo global
    const productoActualizado = productosCatalogo.find(p => p._id === id);
    
    // 1. VERIFICAR DUPLICADOS DEL MISMO PRODUCTO
    if (items.length > 1) {
      console.warn(`⚠️ Producto duplicado detectado: ${id} (${items.length} entradas)`);
      
      // Sumar todas las cantidades
      const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);
      const itemBase = { ...primerItem };
      
      // Aplicar límite según tipo de producto
      if (esPiezaUnica) {
        itemBase.cantidad = Math.min(cantidadTotal, 1); // Máximo 1 para piezas únicas
      } else {
        // Para productos de serie, verificar contra stock actual
        if (productoActualizado && cantidadTotal > productoActualizado.stock) {
          itemBase.cantidad = productoActualizado.stock;
          console.warn(`⚠️ Stock excedido para ${primerItem.nombre}. Ajustado a ${productoActualizado.stock}`);
        } else {
          itemBase.cantidad = cantidadTotal;
        }
      }
      
      // Filtrar y reemplazar
      carrito = carrito.filter(item => item.id !== id);
      carrito.push(itemBase);
      modificado = true;
    }
    
    // 2. VERIFICAR CANTIDADES EXCESIVAS (solo para productos que no están duplicados)
    const itemExistente = carrito.find(item => item.id === id);
    if (itemExistente && productosPorId[id].length === 1) {
      
      // Validar contra stock actual del backend
      if (productoActualizado) {
        const stockDisponible = productoActualizado.stock;
        const cantidadActual = itemExistente.cantidad;
        
        // Para piezas únicas
        if (esPiezaUnica) {
          if (cantidadActual > 1) {
            console.warn(`⚠️ Cantidad incorrecta para pieza única "${itemExistente.nombre}": ${cantidadActual} → 1`);
            itemExistente.cantidad = 1;
            modificado = true;
          }
          if (stockDisponible < 1) {
            console.warn(`⚠️ Pieza única "${itemExistente.nombre}" ya no está disponible. Eliminando del carrito.`);
            carrito = carrito.filter(item => item.id !== id);
            modificado = true;
          }
        } 
        // Para productos de serie
        else {
          if (cantidadActual > stockDisponible && stockDisponible > 0) {
            console.warn(`⚠️ Stock insuficiente para "${itemExistente.nombre}". Cantidad: ${cantidadActual} → Stock: ${stockDisponible}`);
            itemExistente.cantidad = stockDisponible;
            modificado = true;
          } else if (stockDisponible <= 0) {
            console.warn(`⚠️ Producto "${itemExistente.nombre}" agotado. Eliminando del carrito.`);
            carrito = carrito.filter(item => item.id !== id);
            modificado = true;
          }
        }
        
        // Actualizar stock en el objeto del carrito
        if (productoActualizado && itemExistente) {
          itemExistente.stock = stockDisponible;
          itemExistente.precio = productoActualizado.precio_final || productoActualizado.precio_original;
        }
      }
    }
  }
  
  // 3. VERIFICACIÓN ADICIONAL: Eliminar productos con stock 0 que no fueron capturados arriba
  const carritoFiltrado = carrito.filter(item => {
    const productoActualizado = productosCatalogo.find(p => p._id === item.id);
    if (productoActualizado && productoActualizado.stock <= 0) {
      console.warn(`⚠️ Producto "${item.nombre}" agotado. Eliminado del carrito.`);
      modificado = true;
      return false;
    }
    return true;
  });
  
  if (modificado || carritoFiltrado.length !== carrito.length) {
    localStorage.setItem("carrito", JSON.stringify(carritoFiltrado));
    console.log("✅ Carrito corregido y normalizado");
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Mostrar notificación si hay cambios
    mostrarNotificacionCarrito('info', 'Carrito actualizado según disponibilidad');
  }
  
  return carritoFiltrado;
}
// ========== SISTEMA DE NOTIFICACIONES MEJORADO ==========
// Elimina la función anterior 'mostrarNotificacionCarrito' y reemplázala con:

function mostrarNotificacionCarrito(tipo = 'info', mensaje = null) {
  // Eliminar notificaciones existentes para evitar acumulación
  const notificacionesExistentes = document.querySelectorAll('.carrito-notificacion');
  notificacionesExistentes.forEach(notif => notif.remove());
  
  // Mapeo de tipos a configuraciones
  const config = {
    success: {
      icono: '<i class="fas fa-check-circle"></i>',
      titulo: '¡Éxito!',
      defaultMsg: 'Producto agregado correctamente'
    },
    error: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      titulo: 'Error',
      defaultMsg: 'Error al procesar la solicitud'
    },
    warning: {
      icono: '<i class="fas fa-exclamation-triangle"></i>',
      titulo: 'Atención',
      defaultMsg: 'Verifica la información'
    },
    info: {
      icono: '<i class="fas fa-info-circle"></i>',
      titulo: 'Información',
      defaultMsg: 'Carrito actualizado'
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


// Función helper para validar un producto específico antes de agregar al carrito
function validarProductoAntesDeAgregar(producto, cantidadSolicitada) {
  if (!producto) {
    return { valido: false, mensaje: "Producto no encontrado" };
  }
  
  const esPiezaUnica = producto.tipo_inventario === "unico";
  const stockDisponible = producto.stock;
  
  // Validación para piezas únicas
  if (esPiezaUnica) {
    if (stockDisponible < 1) {
      return { valido: false, mensaje: "Lo sentimos, esta pieza única ya no está disponible" };
    }
    if (cantidadSolicitada > 1) {
      return { valido: false, mensaje: "Esta es una pieza única. Solo puedes adquirir 1 unidad" };
    }
    
    // Verificar si ya existe en el carrito
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const yaExiste = carrito.some(item => item.id === producto._id);
    if (yaExiste) {
      return { valido: false, mensaje: "Esta pieza única ya está en tu carrito" };
    }
    
    return { valido: true, cantidadMaxima: 1 };
  }
  
  // Validación para productos de serie
  if (stockDisponible <= 0) {
    return { valido: false, mensaje: "Producto agotado" };
  }
  
  if (cantidadSolicitada > stockDisponible) {
    return { 
      valido: false, 
      mensaje: `Solo hay ${stockDisponible} unidades disponibles`,
      cantidadMaxima: stockDisponible
    };
  }
  
  return { valido: true, cantidadMaxima: stockDisponible };
}


// ========== GALERÍA DE IMÁGENES ==========
function abrirGaleria(listaImagenes) {
  galeriaImagenes = listaImagenes;
  indice = 0;
  document.getElementById("galeriaImagen").src = galeriaImagenes[indice];
  document.getElementById("galleryModal").style.display = "flex";
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("galleryModal").style.display = "none";
};

document.getElementById("prevImg").onclick = () => {
  indice = (indice - 1 + galeriaImagenes.length) % galeriaImagenes.length;
  document.getElementById("galeriaImagen").src = galeriaImagenes[indice];
};

document.getElementById("nextImg").onclick = () => {
  indice = (indice + 1) % galeriaImagenes.length;
  document.getElementById("galeriaImagen").src = galeriaImagenes[indice];
};

document.getElementById("galleryModal").onclick = (e) => {
  if (e.target.id === "galleryModal") {
    e.target.style.display = "none";
  }
};

// ========== SELECTOR DE CANTIDAD ==========
function cambiarCantidad(btn, cambio) {
  const contenedor = btn.parentElement;
  const input = contenedor.querySelector(".cantidad-input");
  const productoId = contenedor.closest(".product-tarjeta").dataset.id;

  let valor = parseInt(input.value);
  const max = parseInt(input.max);
  const min = parseInt(input.min);

  valor += cambio;

  if (valor < min) valor = min;
  if (valor > max) valor = max;

  input.value = valor;

  // Habilitar/deshabilitar botones
  const btnMenos = contenedor.querySelector(".cantidad-btn:first-child");
  const btnMas = contenedor.querySelector(".cantidad-btn:last-child");

  btnMenos.disabled = valor <= min;
  btnMas.disabled = valor >= max;
}

// ========== FILTROS Y BÚSQUEDA ==========
function configurarFiltros() {
  // 1. ORDENAR POR PRECIO
  const btnMenor = document.getElementById("precio-menor");
  const btnMayor = document.getElementById("precio-mayor");

  function ordenarProductos(tipo) {
    const productosOrdenados = [...productosCatalogo].sort((a, b) => {
      const precioA = a.precio_final || a.precio_original;
      const precioB = b.precio_final || b.precio_original;
      return tipo === "asc" ? precioA - precioB : precioB - precioA;
    });

    renderizarProductos(productosOrdenados);
  }

  if (btnMenor) {
    btnMenor.addEventListener("click", (e) => {
      e.preventDefault();
      ordenarProductos("asc");
    });
  }

  if (btnMayor) {
    btnMayor.addEventListener("click", (e) => {
      e.preventDefault();
      ordenarProductos("desc");
    });
  }

  // 2. FILTRAR POR CATEGORÍA
  const filtroCategorias = document.querySelectorAll(
    "#filtro-categorias .Desplegable-item"
  );

  filtroCategorias.forEach((boton) => {
    boton.addEventListener("click", (e) => {
      e.preventDefault();
      const categoriaSeleccionada = boton.dataset.cat;

      let productosFiltrados;
      if (categoriaSeleccionada === "Todos") {
        productosFiltrados = productosCatalogo;
      } else {
        productosFiltrados = productosCatalogo.filter(
          (p) =>
            (p.categoria || "General").toLowerCase() ===
            categoriaSeleccionada.toLowerCase()
        );
      }

      renderizarProductos(productosFiltrados);
    });
  });

  // 3. BUSCAR POR PALABRA CLAVE
  const inputBuscar = document.getElementById("buscar");

  function filtrarProductos() {
    const texto = inputBuscar.value.toLowerCase().trim();

    if (!texto) {
      renderizarProductos(productosCatalogo);
      return;
    }

    const productosFiltrados = productosCatalogo.filter((producto) => {
      const nombre = producto.nombre.toLowerCase();
      const descripcion = (producto.descripcion || "").toLowerCase();
      const categoria = (producto.categoria || "").toLowerCase();

      return (
        nombre.includes(texto) ||
        descripcion.includes(texto) ||
        categoria.includes(texto)
      );
    });

    renderizarProductos(productosFiltrados);
  }

  if (inputBuscar) {
    inputBuscar.addEventListener("input", filtrarProductos);
  }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", function () {
  const btnCarrito = document.getElementById("btn-ver-carrito");

  if (btnCarrito && !btnCarrito.querySelector(".carrito-badge")) {
    const badge = document.createElement("span");
    badge.className = "carrito-badge";
    badge.textContent = "0";
    btnCarrito.style.position = "relative";
    btnCarrito.appendChild(badge);
  }

  // Cargar productos al inicio
  cargarProductosCatalogo();

  // Actualizar contador del carrito
  actualizarContadorCarrito();

  // Configurar menús desplegables
  configurarMenusDesplegables();

  // Esperar a que los productos estén cargados para validar el carrito
  setTimeout(() => {
    if (productosCatalogo && productosCatalogo.length > 0) {
      console.log("🔄 Ejecutando validación del carrito...");
      const carritoValidado = validarCarritoCompleto();
      console.log(`✅ Carrito validado: ${carritoValidado.length} productos`);
      
      // Actualizar contador nuevamente después de la validación
      actualizarContadorCarrito();
    }
  }, 1000); // Dar tiempo a que carguen los productos

});

function configurarMenusDesplegables() {
  // Toggle para categorías
  const btnCategorias = document.querySelector(".Desplegable-btn");
  const contenidoCategorias = document.getElementById("filtro-categorias");

  if (btnCategorias && contenidoCategorias) {
    btnCategorias.addEventListener("click", (e) => {
      e.stopPropagation();
      contenidoCategorias.style.display =
        contenidoCategorias.style.display === "block" ? "none" : "block";
    });
  }

  // Toggle para ordenar
  const btnOrdenar = document.getElementById("desp-ord");
  const contenidoOrdenar = document.getElementById("desp-cotent");

  if (btnOrdenar && contenidoOrdenar) {
    btnOrdenar.addEventListener("click", (e) => {
      e.stopPropagation();
      contenidoOrdenar.style.display =
        contenidoOrdenar.style.display === "block" ? "none" : "block";
    });
  }

  // Cerrar menús al hacer clic fuera
  document.addEventListener("click", () => {
    if (contenidoCategorias) contenidoCategorias.style.display = "none";
    if (contenidoOrdenar) contenidoOrdenar.style.display = "none";
  });
}

// ========== MODAL DE DETALLES SIMPLIFICADO ==========
let productoActual = null;
let imagenesModal = [];
let indiceModal = 0;

function verDetallesCompletos(productoId) {
  productoActual = productosCatalogo.find(p => p._id === productoId);
  
  if (!productoActual) {
    alert('Producto no encontrado');
    return;
  }
  
  // Configurar datos básicos del modal
  document.getElementById('modalProductName').textContent = productoActual.nombre;
  
  const precioFinal = productoActual.precio_final || productoActual.precio_original;
  document.getElementById('modalProductPrice').textContent = `HNL ${precioFinal.toFixed(2)}`;
  
  // Configurar categoría en el header
  const categoriaElement = document.getElementById('modalProductCategory');
  if (categoriaElement) {
    categoriaElement.textContent = productoActual.categoria || 'General';
  }
  
  // Configurar descripción completa
  const descripcionElement = document.getElementById('modalProductDescription');
  const descripcion = productoActual.descripcion || 'Este producto no tiene descripción disponible.';
  
  // Mostrar la descripción con formato mejorado
  descripcionElement.innerHTML = descripcion
    .replace(/\n/g, '<br>')
    .replace(/\•/g, '• ')
    .replace(/(\d+\.)/g, '<br>$1');
  
  // Configurar información adicional
  document.getElementById('modalProductStock').textContent = 
    `${productoActual.stock || 0} ${productoActual.stock === 1 ? 'unidad' : 'unidades'}`;
  
  document.getElementById('modalProductCategoryText').textContent = 
    productoActual.categoria || 'General';
  
  const disponibilidadElement = document.getElementById('modalProductAvailability');
  if (productoActual.stock > 0) {
    disponibilidadElement.textContent = 'Disponible';
    disponibilidadElement.style.color = '#2ecc71';
  } else {
    disponibilidadElement.textContent = 'Agotado';
    disponibilidadElement.style.color = '#e74c3c';
  }
  
  // Configurar galería de imágenes
  imagenesModal = productoActual.imagenes && productoActual.imagenes.length > 0
    ? productoActual.imagenes.map(img => img.url)
    : ['https://via.placeholder.com/800x600?text=Sin+Imagen'];
  
  indiceModal = 0;
  actualizarGaleriaModal();
  
  // Configurar cantidad máxima
  const cantidadInput = document.getElementById('modalCantidadInput');
  cantidadInput.max = productoActual.stock || 1;
  cantidadInput.value = 1;
  
  // Habilitar/deshabilitar botones según stock
  actualizarBotonesModal();
  
  // Configurar eventos de los botones
  const btnCarrito = document.getElementById('modalAddToCart');
  const btnComprar = document.getElementById('modalBuyNow');
  
  btnCarrito.onclick = () => {
    const cantidad = parseInt(cantidadInput.value);
    agregarAlCarritoModal(productoId, precioFinal, cantidad);
  };
  
  btnComprar.onclick = () => {
    const cantidad = parseInt(cantidadInput.value);
    comprarAhoraModal(productoId, precioFinal, cantidad);
  };
  
  // Mostrar modal
  document.getElementById('detailsModal').style.display = 'flex';
  
  // Asegurar que la pestaña de imágenes esté activa por defecto
  cambiarPestana('imagenes');
}

function actualizarGaleriaModal() {
  const imgElement = document.getElementById('galeriaImagenMini');
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  
  if (imagenesModal.length > 0 && imgElement) {
    imgElement.src = imagenesModal[indiceModal];
    
    // Actualizar miniaturas
    thumbnailsContainer.innerHTML = '';
    imagenesModal.forEach((img, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = img;
      thumbnail.className = `thumbnail ${index === indiceModal ? 'active' : ''}`;
      thumbnail.alt = `Miniatura ${index + 1} de ${productoActual?.nombre || 'producto'}`;
      thumbnail.onclick = () => {
        indiceModal = index;
        actualizarGaleriaModal();
      };
      thumbnailsContainer.appendChild(thumbnail);
    });
  }
}

function actualizarBotonesModal() {
  const btnCarrito = document.getElementById('modalAddToCart');
  const btnComprar = document.getElementById('modalBuyNow');
  const cantidadInput = document.getElementById('modalCantidadInput');
  
  if (!productoActual || !btnCarrito || !btnComprar) return;
  
  const stock = productoActual.stock || 0;
  const cantidad = parseInt(cantidadInput.value);
  
  if (stock <= 0) {
    btnCarrito.disabled = true;
    btnComprar.disabled = true;
    btnCarrito.innerHTML = '<i class="fas fa-times"></i> Agotado';
    btnComprar.innerHTML = '<i class="fas fa-times"></i> Agotado';
  } else if (cantidad > stock) {
    btnCarrito.disabled = true;
    btnComprar.disabled = true;
    btnCarrito.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stock insuficiente';
    btnComprar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stock insuficiente';
  } else {
    btnCarrito.disabled = false;
    btnComprar.disabled = false;
    btnCarrito.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
    btnComprar.innerHTML = '<i class="fas fa-bolt"></i> Comprar Ahora';
  }
}

function agregarAlCarritoModal(productoId, precio, cantidad) {
  if (!productoActual || productoActual.stock < cantidad) {
    alert(`Solo hay ${productoActual?.stock || 0} unidades disponibles`);
    return;
  }
  
  // Obtener carrito actual
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  
  // Buscar si el producto ya está en el carrito
  const itemExistente = carrito.find((item) => item.id === productoId);
  
  if (itemExistente) {
    // Actualizar cantidad si ya existe
    if (itemExistente.cantidad + cantidad > productoActual.stock) {
      alert(`No hay suficiente stock. Máximo disponible: ${productoActual.stock - itemExistente.cantidad}`);
      return;
    }
    itemExistente.cantidad += cantidad;
  } else {
    // Agregar nuevo producto al carrito
    carrito.push({
      id: productoId,
      nombre: productoActual.nombre,
      precio: precio,
      cantidad: cantidad,
      imagen: productoActual.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
      stock: productoActual.stock,
      categoria: productoActual.categoria || "General"
    });
  }
  
  // Guardar en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));
  
  // Feedback visual
  const btnCarrito = document.getElementById('modalAddToCart');
  const textoOriginal = btnCarrito.innerHTML;
  
  btnCarrito.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
  btnCarrito.style.backgroundColor = "#2ecc71";
  
  setTimeout(() => {
    btnCarrito.innerHTML = textoOriginal;
    btnCarrito.style.backgroundColor = "";
  }, 1500);
  
  // Actualizar contador del carrito
  actualizarContadorCarrito();
  
  console.log(`🛒 Producto agregado desde modal: ${productoActual.nombre} x${cantidad}`);
}

function comprarAhoraModal(productoId, precio, cantidad) {
  if (!productoActual || productoActual.stock < cantidad) {
    alert(`Solo hay ${productoActual?.stock || 0} unidades disponibles`);
    return;
  }
  
  // Crear carrito temporal con solo este producto
  const carritoDirecto = [{
    id: productoId,
    nombre: productoActual.nombre,
    precio: precio,
    cantidad: cantidad,
    imagen: productoActual.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
    stock: productoActual.stock,
    categoria: productoActual.categoria || "General"
  }];
  
  // Guardar en localStorage
  localStorage.setItem("carrito", JSON.stringify(carritoDirecto));
  
  // Redirigir al carrito
  window.location.href = "./Pages/Carrito.html";
}

// Navegación de imágenes en modal
document.getElementById('prevImgMini').onclick = () => {
  if (imagenesModal.length > 0) {
    indiceModal = (indiceModal - 1 + imagenesModal.length) % imagenesModal.length;
    actualizarGaleriaModal();
  }
};

document.getElementById('nextImgMini').onclick = () => {
  if (imagenesModal.length > 0) {
    indiceModal = (indiceModal + 1) % imagenesModal.length;
    actualizarGaleriaModal();
  }
};

// Cerrar modal de detalles
document.getElementById('closeDetailsModal').onclick = () => {
  document.getElementById('detailsModal').style.display = 'none';
};

// Cambiar pestañas
function cambiarPestana(tabId) {
  // Remover clase active de todas las pestañas
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  // Agregar clase active a la pestaña seleccionada
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const tabContent = document.getElementById(`tab-${tabId}`);
  
  if (tabBtn) tabBtn.classList.add('active');
  if (tabContent) tabContent.classList.add('active');
}

// Configurar eventos de las pestañas
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      cambiarPestana(tabId);
    });
  });
});

// Cerrar modal al hacer click fuera
document.getElementById('detailsModal').onclick = (e) => {
  if (e.target.id === 'detailsModal') {
    e.target.style.display = 'none';
  }
};

// Selector de cantidad en modal
function cambiarCantidadModal(cambio) {
  const input = document.getElementById('modalCantidadInput');
  let valor = parseInt(input.value);
  const max = parseInt(input.max);
  const min = parseInt(input.min);
  
  valor += cambio;
  
  if (valor < min) valor = min;
  if (valor > max) valor = max;
  
  input.value = valor;
  
  // Actualizar estado de los botones
  actualizarBotonesModal();
}

