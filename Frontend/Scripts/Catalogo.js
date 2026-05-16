// ========== CONFIGURACIÓN ==========
let productosCatalogo = [];
let galeriaImagenes = [];
let indice = 0;

// Variables para paginación
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 12;
let totalPaginas = 1;

// Variables para el modal de detalles
let productoActual = null;
let imagenesModal = [];
let indiceModal = 0;

// ========== CARGAR PRODUCTOS DESDE BACKEND ==========
async function cargarProductosCatalogo() {
    const grid = document.getElementById("product-grid");
    
    try {
        console.log("🔄 Cargando productos para catálogo...");
        
        grid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Cargando productos...</p>
            </div>
        `;

        const response = await fetch(`${BACKEND_URL}/productos/catalogo`);
        const result = await response.json();

        if (result.success && result.productos.length > 0) {
            productosCatalogo = result.productos.filter((p) => p.activo !== false);
            console.log(`✅ ${productosCatalogo.length} productos cargados`);
            
            productosFiltrados = [...productosCatalogo];

            calcularTotalPaginas();
            renderizarProductosPaginados();
            configurarFiltros();
            actualizarControlesPaginacion();
            
            // Validar carrito después de cargar productos
            setTimeout(() => {
                if (productosCatalogo && productosCatalogo.length > 0) {
                    console.log("🔄 Ejecutando validación del carrito...");
                    validarCarritoCompleto();
                    actualizarContadorCarrito();
                }
            }, 500);

        } else {
            console.warn("⚠️ No hay productos activos en el catálogo");
            grid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open fa-3x"></i>
                    <h3>No hay productos disponibles</h3>
                    <p>Pronto tendremos nuevos muebles para ti</p>
                </div>
            `;
            ocultarPaginacion();
        }
    } catch (error) {
        console.error("❌ Error al cargar productos:", error);
        grid.innerHTML = `
            <div class="error-products">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Error al cargar productos</h3>
                <p>Intenta recargar la página</p>
            </div>
        `;
        ocultarPaginacion();
    }
}

// ========== CALCULAR TOTAL DE PÁGINAS ==========
function calcularTotalPaginas() {
    totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    if (totalPaginas === 0) totalPaginas = 1;
    
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;
}

// ========== OBTENER PRODUCTOS DE LA PÁGINA ACTUAL ==========
function obtenerProductosPaginaActual() {
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    return productosFiltrados.slice(inicio, fin);
}

// ========== RENDERIZAR PRODUCTOS CON PAGINACIÓN ==========
function renderizarProductosPaginados() {
    const productosPagina = obtenerProductosPaginaActual();
    renderizarProductos(productosPagina);
    actualizarControlesPaginacion();
}

// ========== ACTUALIZAR CONTROLES DE PAGINACIÓN ==========
function actualizarControlesPaginacion() {
    const paginationContainer = document.querySelector('.pagination-numbers');
    const prevLink = document.querySelector('.pagination-link:first-child');
    const nextLink = document.querySelector('.pagination-link:last-child');
    
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    let inicioPaginas = Math.max(1, paginaActual - 2);
    let finPaginas = Math.min(totalPaginas, inicioPaginas + 4);
    
    if (finPaginas - inicioPaginas < 4) {
        inicioPaginas = Math.max(1, finPaginas - 4);
    }
    
    if (inicioPaginas > 1) {
        const firstBtn = document.createElement('a');
        firstBtn.href = '#';
        firstBtn.className = 'pagination-number';
        firstBtn.textContent = '1';
        firstBtn.onclick = (e) => { e.preventDefault(); irAPagina(1); };
        paginationContainer.appendChild(firstBtn);
        
        if (inicioPaginas > 2) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }
    
    for (let i = inicioPaginas; i <= finPaginas; i++) {
        const pageBtn = document.createElement('a');
        pageBtn.href = '#';
        pageBtn.className = `pagination-number ${i === paginaActual ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = (e) => { e.preventDefault(); irAPagina(i); };
        paginationContainer.appendChild(pageBtn);
    }
    
    if (finPaginas < totalPaginas) {
        if (finPaginas < totalPaginas - 1) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
        
        const lastBtn = document.createElement('a');
        lastBtn.href = '#';
        lastBtn.className = 'pagination-number';
        lastBtn.textContent = totalPaginas;
        lastBtn.onclick = (e) => { e.preventDefault(); irAPagina(totalPaginas); };
        paginationContainer.appendChild(lastBtn);
    }
    
    if (prevLink) {
        if (paginaActual <= 1) {
            prevLink.style.opacity = '0.5';
            prevLink.style.pointerEvents = 'none';
        } else {
            prevLink.style.opacity = '1';
            prevLink.style.pointerEvents = 'auto';
            prevLink.onclick = (e) => { e.preventDefault(); irAPagina(paginaActual - 1); };
        }
    }
    
    if (nextLink) {
        if (paginaActual >= totalPaginas) {
            nextLink.style.opacity = '0.5';
            nextLink.style.pointerEvents = 'none';
        } else {
            nextLink.style.opacity = '1';
            nextLink.style.pointerEvents = 'auto';
            nextLink.onclick = (e) => { e.preventDefault(); irAPagina(paginaActual + 1); };
        }
    }
}

// ========== IR A PÁGINA ESPECÍFICA ==========
function irAPagina(pagina) {
    if (pagina < 1 || pagina > totalPaginas) return;
    if (pagina === paginaActual) return;
    
    paginaActual = pagina;
    
    const productGrid = document.getElementById('product-grid');
    if (productGrid) productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    renderizarProductosPaginados();
}

// ========== REINICIAR PAGINACIÓN ==========
function reiniciarPaginacion() {
    paginaActual = 1;
    calcularTotalPaginas();
    renderizarProductosPaginados();
}

// ========== MOSTRAR/OCULTAR PAGINACIÓN ==========
function mostrarPaginacion() {
    const paginationNav = document.querySelector('.pagination');
    if (paginationNav) paginationNav.style.display = 'flex';
}

function ocultarPaginacion() {
    const paginationNav = document.querySelector('.pagination');
    if (paginationNav) paginationNav.style.display = 'none';
}

// ========== RENDERIZAR PRODUCTOS ==========
function renderizarProductos(productos) {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = "";

    if (productos.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search fa-3x"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros filtros de búsqueda</p>
            </div>
        `;
        ocultarPaginacion();
        return;
    }

    if (totalPaginas > 1) mostrarPaginacion();
    else ocultarPaginacion();

    productos.forEach((producto) => {
        const tieneDescuento = producto.descuento > 0;
        const precioFinal = producto.precio_final || producto.precio_original;
        const precioAnterior = producto.precio_original;
        const porcentajeDescuento = producto.descuento ? Math.round(producto.descuento) : 0;
        const esProductoUnico = producto.tipo_inventario === "unico";

        const imagenPrincipal = producto.imagenes && producto.imagenes.length > 0
            ? producto.imagenes[0].url
            : "https://via.placeholder.com/300x200?text=Sin+Imagen";

        const imagenesGaleria = producto.imagenes && producto.imagenes.length > 0
            ? producto.imagenes.map((img) => img.url)
            : ["https://via.placeholder.com/800x600?text=Sin+Imagen"];

        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("data-id", producto._id);
        card.setAttribute("data-precio", precioFinal);
        card.setAttribute("data-nombre", producto.nombre);
        card.setAttribute("data-categoria", producto.categoria || "General");

        let badgesHTML = "";
        if (esProductoUnico) {
            badgesHTML = `<div class="unique-badge"><i class="fas fa-star"></i> PIEZA ÚNICA</div>`;
        } else {
            if (producto.stock <= 0) badgesHTML = `<div class="agotado-badge">AGOTADO</div>`;
            else if (producto.stock <= 3) badgesHTML = `<div class="bajo-stock-badge">ÚLTIMAS UNIDADES</div>`;
        }

        if (tieneDescuento && !esProductoUnico) {
            badgesHTML += `<div class="discount-badge">-${porcentajeDescuento}% OFF</div>`;
        }

        let cantidadHTML = "";
        if (esProductoUnico) {
            cantidadHTML = `<div class="unique-message"><i class="fas fa-gem"></i> Pieza de Diseño Único</div>`;
        } else if (producto.stock > 0) {
            cantidadHTML = `
                <div class="quantity-selector">
                    <button class="qty-btn" onclick="cambiarCantidad(this, -1)">-</button>
                    <input type="number" value="1" min="1" max="${producto.stock}" readonly class="qty-input">
                    <button class="qty-btn" onclick="cambiarCantidad(this, 1)">+</button>
                </div>
            `;
        }

        let stockHTML = "";
        if (!esProductoUnico) {
            stockHTML = `
                <div class="stock-info">
                    <i class="fas fa-boxes"></i>
                    <span class="${producto.stock > 0 ? 'stock-available' : 'stock-agotado'}">
                        ${producto.stock > 0 ? `${producto.stock} unidades disponibles` : "Agotado"}
                    </span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="product-image-area">
                <img src="${imagenPrincipal}" alt="${producto.nombre}" class="product-image" loading="lazy">
                <div class="image-overlay" onclick="abrirGaleria(${JSON.stringify(imagenesGaleria).replace(/"/g, "'")})">
                    <i class="fas fa-images"></i> Ver Galería (${producto.imagenes?.length || 0})
                </div>
                ${badgesHTML}
            </div>
            <div class="product-info">
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-category-badge"><i class="fas fa-tag"></i> ${producto.categoria || "General"}</p>
                <p class="product-short-desc">${producto.descripcion ? producto.descripcion.substring(0, 100) + "..." : "Producto de calidad artesanal"}</p>
                <button class="btn-details" onclick="verDetallesCompletos('${producto._id}')"><i class="fas fa-eye"></i> Ver detalles completos</button>
                
                <div class="price-section">
                    ${tieneDescuento ? `<span class="old-price">HNL ${precioAnterior.toFixed(2)}</span>` : ""}
                    <span class="current-price">HNL ${precioFinal.toFixed(2)}</span>
                </div>
                
                ${stockHTML}
                ${cantidadHTML}
                
                <div class="product-actions">
                    <button class="btn-add-cart" ${producto.stock <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""} onclick="agregarAlCarrito('${producto._id}', ${precioFinal}, this)">
                        <i class="fas fa-shopping-cart"></i> ${producto.stock > 0 ? "Agregar al Carrito" : "Agotado"}
                    </button>
                    <button class="btn-buy-now" ${producto.stock <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""} onclick="comprarAhora('${producto._id}', ${precioFinal})">
                        <i class="fas fa-bolt"></i> Comprar ahora
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ========== FUNCIÓN PARA CAMBIAR CANTIDAD ==========
function cambiarCantidad(btn, cambio) {
    const contenedor = btn.parentElement;
    const input = contenedor.querySelector(".qty-input");
    let valor = parseInt(input.value);
    const max = parseInt(input.max);
    const min = parseInt(input.min);

    valor += cambio;
    if (valor < min) valor = min;
    if (valor > max) valor = max;
    input.value = valor;

    const btnMenos = contenedor.querySelector(".qty-btn:first-child");
    const btnMas = contenedor.querySelector(".qty-btn:last-child");
    if (btnMenos) btnMenos.disabled = valor <= min;
    if (btnMas) btnMas.disabled = valor >= max;
}

// ========== AGREGAR AL CARRITO ==========
function agregarAlCarrito(productoId, precio, elementoBtn, redirigir = false) {
    const card = elementoBtn.closest(".product-card");
    const esProductoUnico = card.querySelector(".unique-message") !== null;
    
    let cantidad = 1;
    if (!esProductoUnico) {
        const inputCantidad = card.querySelector(".qty-input");
        cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
    }

    const producto = productosCatalogo.find((p) => p._id === productoId);
    if (!producto) {
        mostrarNotificacion('error', 'Producto no encontrado');
        return;
    }

    const validacion = validarProductoAntesDeAgregar(producto, cantidad);
    if (!validacion.valido) {
        mostrarNotificacion('warning', validacion.mensaje);
        return;
    }

    if (cantidad > validacion.cantidadMaxima) {
        cantidad = validacion.cantidadMaxima;
        mostrarNotificacion('warning', `Cantidad ajustada a ${cantidad} unidades disponibles`);
    }

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const itemExistente = carrito.find((item) => item.id === productoId);

    if (itemExistente) {
        if (esProductoUnico) {
            mostrarNotificacion('warning', 'Esta pieza única ya está en tu carrito');
            return;
        }
        if (itemExistente.cantidad + cantidad > producto.stock) {
            mostrarNotificacion('warning', `Stock insuficiente. Máximo: ${producto.stock}`);
            return;
        }
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            id: productoId,
            nombre: producto.nombre,
            precio: precio,
            cantidad: cantidad,
            imagen: producto.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
            stock: producto.stock,
            categoria: producto.categoria || "General",
            tipo_inventario: esProductoUnico ? "unico" : "serie"
        });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    const textoOriginal = elementoBtn.innerHTML;
    if (esProductoUnico) {
        elementoBtn.innerHTML = '<i class="fas fa-gem"></i> ¡Pieza Única Agregada!';
        mostrarNotificacion('success', '✨ ¡Pieza única agregada al carrito! ✨');
    } else {
        elementoBtn.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
        mostrarNotificacion('success', `✓ ${producto.nombre} agregado al carrito`);
    }
    elementoBtn.style.backgroundColor = "#2ecc71";
    elementoBtn.style.color = "white";

    setTimeout(() => {
        elementoBtn.innerHTML = textoOriginal;
        elementoBtn.style.backgroundColor = "";
        elementoBtn.style.color = "";
    }, 1500);

    actualizarContadorCarrito();
    console.log(`🛒 Producto agregado: ${producto.nombre} x${cantidad}`);

    // Si se solicita redirección, ir al carrito
    if (redirigir) {
        setTimeout(() => {
        window.location.href = "./Pages/Carrito.html";
        }, 1500);
    }
}

// ========== COMPRAR AHORA ==========
function comprarAhora(productoId, precio) {
    console.log("⚡ Comprar ahora - Producto ID:", productoId);

    const producto = productosCatalogo.find((p) => p._id === productoId);
    if (!producto) {
        mostrarNotificacion('error', '❌ Producto no encontrado');
        return;
    }
    
    const esProductoUnico = producto.tipo_inventario === "unico";
    const tarjeta = document.querySelector(`.product-card[data-id="${productoId}"]`);
    
    let cantidad = 1;
    if (!esProductoUnico && tarjeta) {
        const inputCantidad = tarjeta.querySelector(".qty-input");
        cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
    }

    if (producto.stock < cantidad) {
        mostrarNotificacion('warning', `⚠️ Stock limitado: solo ${producto.stock} unidades disponibles`);
        return;
    }

    if (esProductoUnico && cantidad > 1) cantidad = 1;

    const carritoDirecto = [{
        id: productoId,
        nombre: producto.nombre,
        precio: precio,
        cantidad: cantidad,
        imagen: producto.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
        stock: producto.stock,
        categoria: producto.categoria || "General",
        descripcion: producto.descripcion || "Producto de calidad",
        tipo_inventario: esProductoUnico ? "unico" : "serie"
    }];
    
    localStorage.setItem("carrito", JSON.stringify(carritoDirecto));
    mostrarNotificacion('success', '🛍️ Redirigiendo a facturación...');
    
    setTimeout(() => window.location.href = "./Pages/facturacion_pago.html", 500);
}

// ========== VALIDAR PRODUCTO ANTES DE AGREGAR ==========
function validarProductoAntesDeAgregar(producto, cantidadSolicitada) {
    if (!producto) return { valido: false, mensaje: "Producto no encontrado" };

    const esPiezaUnica = producto.tipo_inventario === "unico";
    const stockDisponible = producto.stock;

    if (esPiezaUnica) {
        if (stockDisponible < 1) return { valido: false, mensaje: "Lo sentimos, esta pieza única ya no está disponible" };
        if (cantidadSolicitada > 1) return { valido: false, mensaje: "Esta es una pieza única. Solo puedes adquirir 1 unidad" };
        
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        const yaExiste = carrito.some(item => item.id === producto._id);
        if (yaExiste) return { valido: false, mensaje: "Esta pieza única ya está en tu carrito" };
        
        return { valido: true, cantidadMaxima: 1 };
    }

    if (stockDisponible <= 0) return { valido: false, mensaje: "Producto agotado" };
    if (cantidadSolicitada > stockDisponible) {
        return { valido: false, mensaje: `Solo hay ${stockDisponible} unidades disponibles`, cantidadMaxima: stockDisponible };
    }
    return { valido: true, cantidadMaxima: stockDisponible };
}

// ========== VALIDAR CARRITO COMPLETO ==========
function validarCarritoCompleto() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let modificado = false;
    
    // Agrupar por ID para detectar duplicados
    const productosPorId = {};
    carrito.forEach(item => {
        if (!productosPorId[item.id]) productosPorId[item.id] = [];
        productosPorId[item.id].push(item);
    });
    
    // Verificar cada producto agrupado
    for (const [id, items] of Object.entries(productosPorId)) {
        const primerItem = items[0];
        const esPiezaUnica = primerItem?.tipo_inventario === "unico" || primerItem?.esPiezaUnica === true;
        const productoActualizado = productosCatalogo.find(p => p._id === id);
        
        // Si hay duplicados del mismo producto, combinar cantidades en un solo item
        if (items.length > 1) {
            console.warn(`⚠️ Producto duplicado detectado: ${id} (${items.length} entradas)`);
            
            // Sumar todas las cantidades
            const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);
            const itemBase = { ...primerItem };
            
            // Aplicar límite según tipo de producto
            if (esPiezaUnica) {
                itemBase.cantidad = Math.min(cantidadTotal, 1);
            } else if (productoActualizado && cantidadTotal > productoActualizado.stock) {
                itemBase.cantidad = productoActualizado.stock;
            } else {
                itemBase.cantidad = cantidadTotal;
            }
            
            // Filtrar y reemplazar (solo un item por producto)
            carrito = carrito.filter(item => item.id !== id);
            carrito.push(itemBase);
            modificado = true;
        }
        
        // Verificar cantidades excesivas
        const itemExistente = carrito.find(item => item.id === id);
        if (itemExistente && productosPorId[id].length === 1 && productoActualizado) {
            const stockDisponible = productoActualizado.stock;
            const cantidadActual = itemExistente.cantidad;
            
            if (esPiezaUnica) {
                if (cantidadActual > 1) {
                    itemExistente.cantidad = 1;
                    modificado = true;
                }
                if (stockDisponible < 1) {
                    carrito = carrito.filter(item => item.id !== id);
                    modificado = true;
                }
            } else {
                if (cantidadActual > stockDisponible && stockDisponible > 0) {
                    itemExistente.cantidad = stockDisponible;
                    modificado = true;
                } else if (stockDisponible <= 0) {
                    carrito = carrito.filter(item => item.id !== id);
                    modificado = true;
                }
            }
            
            if (productoActualizado && itemExistente) {
                itemExistente.stock = stockDisponible;
                itemExistente.precio = productoActualizado.precio_final || productoActualizado.precio_original;
            }
        }
    }
    
    // Eliminar productos con stock 
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
        actualizarContadorCarrito();
        mostrarNotificacion('info', 'Carrito actualizado según disponibilidad');
    }
    
    return carritoFiltrado;
}

// ========== ACTUALIZAR CONTADOR CARRITO ==========
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const totalProductos = carrito.length;
    const badge = document.querySelector(".cart-badge");
    if (badge) {
        badge.textContent = totalProductos;
        badge.style.display = totalProductos > 0 ? "flex" : "none";
    }
}

// ========== MOSTRAR NOTIFICACIÓN ==========
function mostrarNotificacion(tipo = 'info', mensaje = null) {
    // Eliminar notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.carrito-notificacion');
    notificacionesExistentes.forEach(notif => notif.remove());
    
    const config = {
        success: { icono: '<i class="fas fa-check-circle"></i>', defaultMsg: 'Producto agregado correctamente' },
        error: { icono: '<i class="fas fa-exclamation-triangle"></i>', defaultMsg: 'Error al procesar la solicitud' },
        warning: { icono: '<i class="fas fa-exclamation-triangle"></i>', defaultMsg: 'Verifica la información' },
        info: { icono: '<i class="fas fa-info-circle"></i>', defaultMsg: 'Carrito actualizado' }
    };
    
    const cfg = config[tipo] || config.info;
    const texto = mensaje || cfg.defaultMsg;
    
    const notificacion = document.createElement('div');
    notificacion.className = `carrito-notificacion ${tipo}`;
    notificacion.innerHTML = `${cfg.icono}<span>${texto}</span>`;
    document.body.appendChild(notificacion);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        if (notificacion && notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notificacion && notificacion.parentNode) notificacion.remove();
            }, 300);
        }
    }, 3000);
}

// ========== GALERÍA DE IMÁGENES ==========
function abrirGaleria(listaImagenes) {
    galeriaImagenes = listaImagenes;
    indice = 0;
    const modal = document.getElementById("galleryModal");
    const img = document.getElementById("galeriaImagen");
    if (img && galeriaImagenes.length > 0) img.src = galeriaImagenes[indice];
    if (modal) modal.style.display = "flex";
}

// ========== FILTROS Y BÚSQUEDA ==========
function configurarFiltros() {
    const btnMenor = document.getElementById("precio-menor");
    const btnMayor = document.getElementById("precio-mayor");

    function ordenarProductos(tipo) {
        productosFiltrados = [...productosCatalogo].sort((a, b) => {
            const precioA = a.precio_final || a.precio_original;
            const precioB = b.precio_final || b.precio_original;
            return tipo === "asc" ? precioA - precioB : precioB - precioA;
        });
        reiniciarPaginacion();
    }

    if (btnMenor) btnMenor.addEventListener("click", (e) => { e.preventDefault(); ordenarProductos("asc"); });
    if (btnMayor) btnMayor.addEventListener("click", (e) => { e.preventDefault(); ordenarProductos("desc"); });

    const filtroCategorias = document.querySelectorAll("#filtro-categorias .dropdown-item");
    filtroCategorias.forEach((boton) => {
        boton.addEventListener("click", (e) => {
            e.preventDefault();
            const categoriaSeleccionada = boton.dataset.cat;
            
            if (categoriaSeleccionada === "Todos") {
                productosFiltrados = [...productosCatalogo];
            } else {
                productosFiltrados = productosCatalogo.filter(
                    (p) => (p.categoria || "General").toLowerCase() === categoriaSeleccionada.toLowerCase()
                );
            }
            reiniciarPaginacion();
        });
    });

    const inputBuscar = document.getElementById("buscar");
    if (inputBuscar) {
        inputBuscar.addEventListener("input", () => {
            const texto = inputBuscar.value.toLowerCase().trim();
            if (!texto) {
                productosFiltrados = [...productosCatalogo];
            } else {
                productosFiltrados = productosCatalogo.filter((producto) => {
                    const nombre = producto.nombre.toLowerCase();
                    const descripcion = (producto.descripcion || "").toLowerCase();
                    const categoria = (producto.categoria || "").toLowerCase();
                    return nombre.includes(texto) || descripcion.includes(texto) || categoria.includes(texto);
                });
            }
            reiniciarPaginacion();
        });
    }
}

// ========== CONFIGURAR MENÚS DESPLEGABLES ==========
function configurarMenusDesplegables() {
    const btnCategorias = document.getElementById("btn-categorias");
    const contenidoCategorias = document.getElementById("filtro-categorias");
    const btnOrdenar = document.getElementById("desp-ord");
    const contenidoOrdenar = document.getElementById("desp-cotent");

    if (btnCategorias && contenidoCategorias) {
        btnCategorias.addEventListener("click", (e) => {
            e.stopPropagation();
            contenidoCategorias.classList.toggle("show");
        });
    }

    if (btnOrdenar && contenidoOrdenar) {
        btnOrdenar.addEventListener("click", (e) => {
            e.stopPropagation();
            contenidoOrdenar.classList.toggle("show");
        });
    }

    document.addEventListener("click", () => {
        if (contenidoCategorias) contenidoCategorias.classList.remove("show");
        if (contenidoOrdenar) contenidoOrdenar.classList.remove("show");
    });
}

// ========== VER DETALLES COMPLETOS (MODAL COMPACTO) ==========
function verDetallesCompletos(productoId) {
    productoActual = productosCatalogo.find(p => p._id === productoId);
    
    if (!productoActual) {
        mostrarNotificacion('error', 'Producto no encontrado');
        return;
    }
    
    const precioFinal = productoActual.precio_final || productoActual.precio_original;
    const tieneDescuento = productoActual.descuento > 0;
    const precioAnterior = productoActual.precio_original;
    const porcentajeDescuento = productoActual.descuento ? Math.round(productoActual.descuento) : 0;
    const esProductoUnico = productoActual.tipo_inventario === "unico";
    
    document.getElementById('modalProductName').textContent = productoActual.nombre;
    document.getElementById('modalProductCategory').textContent = productoActual.categoria || 'General';
    
    const priceContainer = document.getElementById('modalProductPrice');
    if (tieneDescuento && !esProductoUnico) {
        priceContainer.innerHTML = `
            <span class="old-price-modal">HNL ${precioAnterior.toFixed(2)}</span>
            <span class="current-price-modal">HNL ${precioFinal.toFixed(2)}</span>
            <span class="discount-badge-modal">-${porcentajeDescuento}%</span>
        `;
    } else {
        priceContainer.innerHTML = `<span class="current-price-modal">HNL ${precioFinal.toFixed(2)}</span>`;
    }
    
    const descripcionElement = document.getElementById('modalProductDescription');
    const descripcion = productoActual.descripcion || 'Este producto no tiene descripción disponible.';
    descripcionElement.innerHTML = descripcion.replace(/\n/g, '<br>');
    
    document.getElementById('modalProductStock').textContent = `${productoActual.stock || 0} ${productoActual.stock === 1 ? 'unidad' : 'unidades'}`;
    document.getElementById('modalProductCategoryText').textContent = productoActual.categoria || 'General';
    
    const disponibilidadElement = document.getElementById('modalProductAvailability');
    if (productoActual.stock > 0) {
        disponibilidadElement.textContent = 'Disponible';
        disponibilidadElement.style.color = '#2ecc71';
    } else {
        disponibilidadElement.textContent = 'Agotado';
        disponibilidadElement.style.color = '#e74c3c';
    }
    
    const uniqueMessageContainer = document.getElementById('modalUniqueMessage');
    if (esProductoUnico) {
        if (uniqueMessageContainer) {
            uniqueMessageContainer.innerHTML = `<div class="unique-message-modal"><i class="fas fa-gem"></i> Pieza de Diseño Único - Solo 1 unidad disponible</div>`;
            uniqueMessageContainer.style.display = 'block';
        }
        const quantityContainer = document.querySelector('.details-quantity-compact');
        if (quantityContainer) quantityContainer.style.display = 'none';
    } else {
        if (uniqueMessageContainer) uniqueMessageContainer.style.display = 'none';
        const quantityContainer = document.querySelector('.details-quantity-compact');
        if (quantityContainer) quantityContainer.style.display = 'flex';
    }
    
    imagenesModal = productoActual.imagenes && productoActual.imagenes.length > 0
        ? productoActual.imagenes.map(img => img.url)
        : ['https://via.placeholder.com/400x400?text=Sin+Imagen'];
    
    indiceModal = 0;
    actualizarGaleriaCompacta();
    
    const cantidadInput = document.getElementById('modalCantidadInput');
    if (cantidadInput) {
        cantidadInput.max = esProductoUnico ? 1 : (productoActual.stock || 1);
        cantidadInput.value = 1;
    }
    
    actualizarBotonesCompactos();
    
    const btnCarrito = document.getElementById('modalAddToCart');
    const btnComprar = document.getElementById('modalBuyNow');
    
    if (btnCarrito) {
        btnCarrito.onclick = () => {
            const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
            agregarAlCarritoCompacto(productoId, precioFinal, cantidad, esProductoUnico);
        };
    }
    
    if (btnComprar) {
        btnComprar.onclick = () => {
            const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
            comprarAhoraCompacto(productoId, precioFinal, cantidad, esProductoUnico);
        };
    }
    
    const modal = document.getElementById('detailsModal');
    if (modal) modal.style.display = 'flex';
}

function actualizarGaleriaCompacta() {
    const mainImage = document.getElementById('modalMainImage');
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    
    if (imagenesModal.length > 0 && mainImage) {
        mainImage.src = imagenesModal[indiceModal];
        mainImage.alt = `Imagen ${indiceModal + 1} de ${productoActual?.nombre || 'producto'}`;
        
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
            imagenesModal.forEach((img, index) => {
                const thumbnail = document.createElement('img');
                thumbnail.src = img;
                thumbnail.className = `modal-thumbnail ${index === indiceModal ? 'active' : ''}`;
                thumbnail.alt = `Miniatura ${index + 1}`;
                thumbnail.onclick = () => {
                    indiceModal = index;
                    actualizarGaleriaCompacta();
                };
                thumbnailsContainer.appendChild(thumbnail);
            });
        }
    }
}

function cambiarImagenModal(direccion) {
    if (imagenesModal.length > 0) {
        indiceModal = (indiceModal + direccion + imagenesModal.length) % imagenesModal.length;
        actualizarGaleriaCompacta();
    }
}

function actualizarBotonesCompactos() {
    const btnCarrito = document.getElementById('modalAddToCart');
    const btnComprar = document.getElementById('modalBuyNow');
    const cantidadInput = document.getElementById('modalCantidadInput');
    
    if (!productoActual || !btnCarrito || !btnComprar) return;
    
    const stock = productoActual.stock || 0;
    const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
    const esProductoUnico = productoActual.tipo_inventario === "unico";
    
    if (stock <= 0) {
        btnCarrito.disabled = true;
        btnComprar.disabled = true;
        btnCarrito.innerHTML = '<i class="fas fa-times"></i> Agotado';
        btnComprar.innerHTML = '<i class="fas fa-times"></i> Agotado';
        btnCarrito.style.opacity = '0.5';
        btnComprar.style.opacity = '0.5';
    } else if (cantidad > stock && !esProductoUnico) {
        btnCarrito.disabled = true;
        btnComprar.disabled = true;
        btnCarrito.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stock insuficiente';
        btnComprar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stock insuficiente';
        btnCarrito.style.opacity = '0.5';
        btnComprar.style.opacity = '0.5';
    } else {
        btnCarrito.disabled = false;
        btnComprar.disabled = false;
        btnCarrito.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
        btnComprar.innerHTML = '<i class="fas fa-bolt"></i> Comprar Ahora';
        btnCarrito.style.opacity = '1';
        btnComprar.style.opacity = '1';
    }
}

function cambiarCantidadModal(delta) {
    const input = document.getElementById('modalCantidadInput');
    if (!input) return;
    
    let valor = parseInt(input.value);
    const max = parseInt(input.max);
    const min = parseInt(input.min);
    
    valor += delta;
    if (valor < min) valor = min;
    if (valor > max) valor = max;
    
    input.value = valor;
    actualizarBotonesCompactos();
}

function agregarAlCarritoCompacto(productoId, precio, cantidad, esProductoUnico) {
    if (!productoActual || productoActual.stock < cantidad) {
        mostrarNotificacion('warning', `Solo hay ${productoActual?.stock || 0} unidades disponibles`);
        return;
    }
    
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const itemExistente = carrito.find((item) => item.id === productoId);
    
    if (itemExistente) {
        if (esProductoUnico) {
            mostrarNotificacion('warning', 'Esta pieza única ya está en tu carrito');
            return;
        }
        if (itemExistente.cantidad + cantidad > productoActual.stock) {
            mostrarNotificacion('warning', `No hay suficiente stock. Máximo: ${productoActual.stock - itemExistente.cantidad}`);
            return;
        }
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            id: productoId,
            nombre: productoActual.nombre,
            precio: precio,
            cantidad: cantidad,
            imagen: productoActual.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
            stock: productoActual.stock,
            categoria: productoActual.categoria || "General",
            tipo_inventario: esProductoUnico ? "unico" : "serie"
        });
    }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    
    const btnCarrito = document.getElementById('modalAddToCart');
    const textoOriginal = btnCarrito.innerHTML;
    
    btnCarrito.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
    btnCarrito.style.backgroundColor = "#2ecc71";
    btnCarrito.style.color = "white";
    
    setTimeout(() => {
        btnCarrito.innerHTML = textoOriginal;
        btnCarrito.style.backgroundColor = "";
        btnCarrito.style.color = "";
    }, 1500);
    
    actualizarContadorCarrito();
    mostrarNotificacion('success', `✓ ${productoActual.nombre} agregado al carrito`);
}

function comprarAhoraCompacto(productoId, precio, cantidad, esProductoUnico) {
    if (!productoActual || productoActual.stock < cantidad) {
        mostrarNotificacion('warning', `Solo hay ${productoActual?.stock || 0} unidades disponibles`);
        return;
    }
    
    const carritoDirecto = [{
        id: productoId,
        nombre: productoActual.nombre,
        precio: precio,
        cantidad: cantidad,
        imagen: productoActual.imagenes?.[0]?.url || "https://via.placeholder.com/100x100?text=Sin+Imagen",
        stock: productoActual.stock,
        categoria: productoActual.categoria || "General",
        tipo_inventario: esProductoUnico ? "unico" : "serie"
    }];
    
    localStorage.setItem("carrito", JSON.stringify(carritoDirecto));
    mostrarNotificacion('success', '🛍️ Redirigiendo a facturación...');
    window.location.href = "./Pages/Carrito.html";
}

function cambiarPestanaModal(tabId) {
    document.querySelectorAll('.tab-btn-compact').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content-compact').forEach(content => content.classList.remove('active'));
    
    const tabBtn = document.querySelector(`.tab-btn-compact[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(`tab-${tabId}`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// ========== EVENTOS DEL MODAL ==========
document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('galleryModal').style.display = 'none';
});

document.getElementById('closeDetailsModal')?.addEventListener('click', () => {
    document.getElementById('detailsModal').style.display = 'none';
});

document.getElementById('prevImg')?.addEventListener('click', () => {
    if (galeriaImagenes.length > 0) {
        indice = (indice - 1 + galeriaImagenes.length) % galeriaImagenes.length;
        document.getElementById('galeriaImagen').src = galeriaImagenes[indice];
    }
});

document.getElementById('nextImg')?.addEventListener('click', () => {
    if (galeriaImagenes.length > 0) {
        indice = (indice + 1) % galeriaImagenes.length;
        document.getElementById('galeriaImagen').src = galeriaImagenes[indice];
    }
});

document.getElementById('prevImgMini')?.addEventListener('click', () => {
    if (imagenesModal.length > 0) {
        indiceModal = (indiceModal - 1 + imagenesModal.length) % imagenesModal.length;
        actualizarGaleriaCompacta();
    }
});

document.getElementById('nextImgMini')?.addEventListener('click', () => {
    if (imagenesModal.length > 0) {
        indiceModal = (indiceModal + 1) % imagenesModal.length;
        actualizarGaleriaCompacta();
    }
});

document.getElementById('galleryModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'galleryModal') e.target.style.display = 'none';
});

document.getElementById('detailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailsModal') e.target.style.display = 'none';
});

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", function () {
    // Crear badge del carrito si no existe
    const btnCarrito = document.getElementById("btn-ver-carrito");
    if (btnCarrito && !btnCarrito.querySelector(".cart-badge")) {
        const badge = document.createElement("span");
        badge.className = "cart-badge";
        badge.textContent = "0";
        btnCarrito.style.position = "relative";
        btnCarrito.appendChild(badge);
    }
    
    actualizarContadorCarrito();
    configurarMenusDesplegables();
    cargarProductosCatalogo();

    document.querySelectorAll('.tab-btn-compact').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            cambiarPestanaModal(tabId);
        });
    });
});