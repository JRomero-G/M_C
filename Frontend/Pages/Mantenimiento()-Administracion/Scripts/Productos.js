// ========== GESTIÓN DE PRODUCTOS (SOLO ADMIN) VERSION 1==========

// ============================================
//     VARIABLES GLOBALES DE PAGINACIÓN DE PRODUCTOS
// ============================================
let paginaActualProductos = 1;
const limitePorPaginaProductos = 12;
let totalPaginasProductos = 1;
let productosCargados = [];
let totalProductosBD = 0;

/**
 * Carga los productos desde el backend con paginación y filtros
 */
async function cargarProductos() {
  if (!AuthService.isAdmin()) {
    return;
  }

  const tbody = document.getElementById("products-table");
  if (!tbody) return;

  try {
    // Obtener filtros actuales
    const filtros = obtenerFiltrosProductos();
    const busqueda = document.getElementById("buscador-productos")?.value.trim() || "";

    // Construir query string con paginación
    let queryString = `?pagina=${paginaActualProductos}&limite=${limitePorPaginaProductos}`;

    // Agregar filtros
    if (busqueda) {
      queryString += `&buscar=${encodeURIComponent(busqueda)}`;
    }
    if (filtros.estado) {
      queryString += `&estado=${filtros.estado}`;
    }
    if (filtros.stock) {
      queryString += `&stock=${filtros.stock}`;
    }
    if (filtros.categoria) {
      queryString += `&categoria=${encodeURIComponent(filtros.categoria)}`;
    }
    
    // Llamar al endpoint con paginación
    const url = `${window.BACKEND_URL}/productos/gestion${queryString}`;
    const response = await fetchConAuth(url);

    if (!response) {
      console.error("No se pudo conectar al servidor");
      return;
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Error al cargar productos");
    }

    // Actualizar variables de paginación
    paginaActualProductos = result.paginacion.pagina;
    totalPaginasProductos = result.paginacion.paginas;
    totalProductosBD = result.paginacion.total;
    productosCargados = result.productos || [];

    // Actualizar tabla
    actualizarTablaProductos(productosCargados);

    // Actualizar contador en dashboard si existe
    actualizarContadorProductosDashboard();

    // Actualizar controles de paginación
    actualizarControlesPaginacionProductos(totalProductosBD);

  } catch (error) {
    console.error("Error al cargar productos:", error);

    // Mostrar error en la tabla
    const tbody = document.getElementById("products-table");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px; color: #dc3545;">
            Error al cargar los productos: ${error.message}
          </td>
        </tr>
      `;
    }
    
    // Limpiar paginación en caso de error
    actualizarControlesPaginacionProductos(0);
  } finally {
    // Limpiar icono de carga del buscador
    limpiarIconoCargaBuscador();
  }
}

// Función para limpiar el icono de carga del buscador
function limpiarIconoCargaBuscador() {
  const iconoCargando = document.querySelector('.buscador-cargando');
  if (iconoCargando) {
    iconoCargando.remove();
  }
}

/**
 * Obtiene productos desde el backend
 */
async function obtenerProductosDelBackend() {
  const filtros = obtenerFiltrosProductos();
  const params = new URLSearchParams({
    buscar: filtros.buscar,
    estado: filtros.estado,
    stock: filtros.stock,
    categoria: filtros.categoria,
    pagina: 1,
    limite: 12
  });

  const url = `${window.BACKEND_URL}/productos/gestion?${params.toString()}`;
  
  const response = await fetchConAuth(url);
  if (!response) return [];

  const result = await response.json();
  return result.success ? result.productos : [];
}

/**
 * Actualiza la tabla de productos con los datos cargados
 */
function actualizarTablaProductos(productos) {
  const tbody = document.getElementById("products-table");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Mostrar mensaje si no hay productos
  if (!productos || productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 20px;">
          No hay productos para mostrar con estos filtros
        </td>
      </tr>
    `;
    return;
  }

  // Renderizar cada producto
  productos.forEach((producto) => {
    const fila = document.createElement("tr");
    const fecha_de_registro = formatearFecha(producto.createdAt);
    const precioFinal = producto.precio_final || producto.precio_original || 0;

    fila.innerHTML = `
      <td>${
        producto._id ? producto._id.toString().substring(0, 8) + "..." : "N/A"
      }</td>
      <td>${producto.nombre}</td>
      <td>${producto.categoria || "General"}</td>
      <td>HNL ${(producto.precio_original || 0).toFixed(2)}</td>
      <td>${producto.descuento || 0}%</td>
      <td>HNL ${precioFinal.toFixed(2)}</td>
      <td>${producto.stock || 0}</td>
      <td>${fecha_de_registro || "N/A"}</td>
      <td><span class="${producto.activo !== false ? "success" : "danger"}">
          ${producto.activo !== false ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn-secondary btn-sm" onclick="cargarParaActualizar('${producto._id}')">
          <i class="fas fa-edit"></i>
        </button>

        ${
          producto.activo !== false
            ? `<button class="btn-danger btn-sm" onclick="confirmarDesactivarProducto('${producto._id}')">
                 <i class="fas fa-ban"></i>
               </button>`
            : `<button class="btn-success btn-sm" onclick="confirmarActivarProducto('${producto._id}')">
                 <i class="fas fa-check"></i>
               </button>`
        }
      </td>
    `;
    tbody.appendChild(fila);
  });
}

/**
 * Filtra productos según búsqueda
 */
function filtrarProductos() {
  if (!AuthService.isAdmin()) return;

  const busqueda =
    document.getElementById("buscador-productos")?.value.toLowerCase() || "";
  const filas = document.querySelectorAll("#products-table tr");

  filas.forEach((fila) => {
    const textoFila = fila.textContent.toLowerCase();
    fila.style.display = textoFila.includes(busqueda) ? "" : "none";
  });
}

function obtenerFiltrosProductos() {
  return {
    estado: document.getElementById("filtro-estado-producto")?.value || "",
    stock: document.getElementById("filtro-stock")?.value || "",
    categoria: document.getElementById("filtro-categoria-producto")?.value || "",
  };
}

function configurarFiltrosProductos() {
  // Determinar si necesitamos delay
  const necesitaDelay = () => {
    // Si hay menos de 50 productos, no necesita delay
    return totalProductosBD >= 50;
  };
  
  // Configurar todos los filtros
  const ids = [
    "buscador-productos",
    "filtro-estado-producto", 
    "filtro-stock",
    "filtro-categoria-producto"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (necesitaDelay()) {
        // Con delay si hay muchos productos
        let timeout;
        el.addEventListener("change", () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            paginaActualProductos = 1;
            cargarProductos();
          }, 500);
        });
      } else {
        // Sin delay si hay pocos productos
        el.addEventListener("change", () => {
          paginaActualProductos = 1;
          cargarProductos();
        });
      }
    }
  });

  // Para el buscador siempre usar debounce (pero corto)
  const buscador = document.getElementById("buscador-productos");
  if (buscador) {
    let timeout;
    buscador.addEventListener("input", () => {
      clearTimeout(timeout);
      
      // Delay más corto para pocos productos
      const delay = necesitaDelay() ? 400 : 200;
      
      timeout = setTimeout(() => {
        paginaActualProductos = 1;
        cargarProductos();
      }, delay);
    });
  }
}

/**
 * Obtiene datos del formulario de registro
 */
function obtenerDatosFormularioRegistro() {
  return {
    nombre: document.getElementById("product-name")?.value.trim() || "",
    categoria: document.getElementById("product-category")?.value || "",
    precioOriginal:
      parseFloat(document.getElementById("product-precio-original")?.value) ||
      0,
    descuento:
      parseFloat(document.getElementById("product-descuento")?.value) || 0,
    stock: parseInt(document.getElementById("product-stock")?.value) || 0,
    descripcion:
      document.getElementById("product-description")?.value.trim() || "",
    files: document.getElementById("product-images")?.files || [],
  };
}

/**
 * Valida datos del formulario de registro
 */
function validarDatosRegistro(formData) {
  if (
    !formData.nombre ||
    !formData.categoria ||
    isNaN(formData.precioOriginal) ||
    isNaN(formData.stock)
  ) {
    alert("❌ Completa: Nombre, Categoría, Precio Original y Stock");
    return false;
  }

  if (formData.files.length === 0) {
    alert("❌ Selecciona al menos una imagen");
    return false;
  }

  return true;
}

/**
 * Registra un nuevo producto
 */
async function registrarProducto(e) {
  e.preventDefault();

  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  const formData = obtenerDatosFormularioRegistro();
  if (!validarDatosRegistro(formData)) return;

  const btnSubmit = document.querySelector(
    '#form-registrar button[type="submit"]'
  );
  const textoOriginal = btnSubmit.innerHTML;

  try {
    btnSubmit.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btnSubmit.disabled = true;

    const imagenesSubidas = await subirImagenesACloudinary(formData.files);

    const productoData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio_original: formData.precioOriginal,
      descuento: formData.descuento,
      stock: formData.stock,
      imagenes: imagenesSubidas,
      categoria: formData.categoria,
    };

    const response = await fetchAdmin(`${window.BACKEND_URL}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoData),
    });

    if (!response) return;

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || `Error ${response.status}`);

    mostrarMensajeExito(formData);
    limpiarFormularioRegistro();
    paginaActualProductos = 1;
    await cargarProductos();
    actualizarDashboard();
    cambiarASeccion("productos", "Productos");

  } catch (error) {
    mostrarMensajeError(error);
  } finally {
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
  }
}

/**
 * Muestra mensaje de éxito al registrar producto
 */
function mostrarMensajeExito(formData) {
  const precioFinal = formData.precioOriginal * (1 - formData.descuento / 100);
  alert(
    `✅ Producto "${formData.nombre}" registrado exitosamente!\n• ${
      formData.files.length
    } imágenes\n• Stock: ${
      formData.stock
    } unidades\n• Precio: HNL ${precioFinal.toFixed(2)}`
  );
}

/**
 * Muestra mensaje de error
 */
function mostrarMensajeError(error) {
  console.error("Error:", error);
  alert(`❌ Error: ${error.message || "No se pudo completar la operación"}`);
}

/**
 * Limpia el formulario de registro
 */
function limpiarFormularioRegistro() {
  const formRegistrar = document.getElementById("form-registrar");
  if (formRegistrar) {
    formRegistrar.reset();
  }

  const previewImagenes = document.getElementById("preview-imagenes");
  if (previewImagenes) {
    previewImagenes.innerHTML = "";
  }

  window.imagenesRegistro = [];
  actualizarContadorImagenes();
}

/**
 * Busca un producto para actualizar
 */
async function buscarParaActualizar() {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  const busqueda =
    document.getElementById("search-update")?.value.toLowerCase() || "";
  if (!busqueda) {
    alert("Por favor ingresa un ID o nombre para buscar");
    return;
  }

  const producto = window.productos.find(
    (p) =>
      (p._id && p._id.toString().includes(busqueda)) ||
      (p.nombre && p.nombre.toLowerCase().includes(busqueda))
  );

  if (producto) {
    await cargarParaActualizar(producto._id);
  } else {
    alert("Producto no encontrado");
    ocultarFormularioActualizar();
  }
}

/**
 * Carga un producto para actualizar - VERSIÓN 2
 */
async function cargarParaActualizar(idProducto) {
  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  try {
    // Resetear variables de imágenes
    window.imagenesActualesProducto = [];
    window.imagenesMarcadasParaEliminar = [];

    const producto = await obtenerProductoPorId(idProducto);

    if (!producto) {
      alert("❌ Producto no encontrado en el servidor");
      return;
    }

    cambiarASeccion("actualizar", "Actualizar Producto");

    // Rellenar formulario
    rellenarFormularioActualizar(producto);

    // Guardar imágenes en variable global ANTES de mostrarlas
    window.imagenesActualesProducto = producto.imagenes || [];

    // Mostrar imágenes
    mostrarImagenesActualesProducto(producto.imagenes || []);

  } catch (error) {
    console.error("Error al cargar producto para actualizar:", error);
    alert(`Error al cargar el producto: ${error.message}`);
  }
}

/**
 * Obtiene un producto por ID
 */
async function obtenerProductoPorId(id) {
  const response = await fetchConAuth(`${window.BACKEND_URL}/productos/${id}`);
  if (!response) return null;

  const result = await response.json();
  return result.success ? result.producto : null;
}

/**
 * Rellena el formulario de actualización
 */
function rellenarFormularioActualizar(producto) {
  const searchUpdate = document.getElementById("search-update");
  const resultadoBusqueda = document.getElementById("resultado-busqueda");
  const formActualizar = document.getElementById("form-actualizar");
  const nombreProductoEncontrado = document.getElementById(
    "nombre-producto-encontrado"
  );

  if (searchUpdate) searchUpdate.value = producto.nombre;
  if (resultadoBusqueda) resultadoBusqueda.style.display = "block";
  if (nombreProductoEncontrado)
    nombreProductoEncontrado.textContent = producto.nombre;
  if (formActualizar) formActualizar.style.display = "block";

  // Rellenar campos del formulario
  document.getElementById("update-id").value = producto._id;
  document.getElementById("update-name").value = producto.nombre || "";
  document.getElementById("update-precio-original").value =
    producto.precio_original || "";
  document.getElementById("update-discount").value = producto.descuento || 0;
  document.getElementById("update-stock").value = producto.stock || 0;
  document.getElementById("update-description").value =
    producto.descripcion || "";
  document.getElementById("update-categoria").value =
    producto.categoria || "General";

  const precioBase = producto.precio_original || 0;
  const desc = producto.descuento || 0;
  const precioConDescuento = precioBase * (1 - desc / 100);
  document.getElementById("update-precio-actual").value =
    precioConDescuento.toFixed(2);
}

/**
 * Obtiene datos del formulario de actualización
 */
function obtenerDatosFormularioActualizar() {
  return {
    nombre: document.getElementById("update-name")?.value.trim() || "",
    precioOriginal:
      parseFloat(document.getElementById("update-precio-original")?.value) || 0,
    descuento:
      parseFloat(document.getElementById("update-discount")?.value) || 0,
    stock: parseInt(document.getElementById("update-stock")?.value) || 0,
    descripcion:
      document.getElementById("update-description")?.value.trim() || "",
    categoria: document.getElementById("update-categoria")?.value || "",
    files: document.getElementById("update-images")?.files || [],
  };
}

/**
 * Valida datos de actualización
 */
function validarDatosActualizacion(formData) {
  if (
    !formData.nombre ||
    isNaN(formData.precioOriginal) ||
    isNaN(formData.stock)
  ) {
    alert("❌ Completa los campos obligatorios: Nombre, Precio y Stock");
    return false;
  }
  return true;
}

/**
 * Actualiza un producto existente - CON VALIDACIÓN MEJORADA
 */
async function actualizarProducto(e) {
  e.preventDefault();

  if (!AuthService.isAdmin()) {
    alert("Acceso denegado: Se requieren permisos de administrador");
    return;
  }

  const id = document.getElementById("update-id")?.value;
  const formData = obtenerDatosFormularioActualizar();

  if (!id) {
    alert("❌ Error: No hay ID de producto");
    return;
  }

  if (!validarDatosActualizacion(formData)) return;

  const btnSubmit = document.querySelector(
    '#form-actualizar button[type="submit"]'
  );
  const textoOriginal = btnSubmit.innerHTML;

  try {
    btnSubmit.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    btnSubmit.disabled = true;

    // Obtener imágenes actuales del producto para validación
    let productoActual;
    try {
      const response = await fetchConAuth(
        `${window.BACKEND_URL}/productos/${id}`
      );
      if (response) {
        const result = await response.json();
        if (result.success) {
          productoActual = result.producto;
        }
      }
    } catch (error) {
      console.warn("No se pudo obtener producto actual:", error);
    }

    const imagenesActualesCount = productoActual?.imagenes?.length || 0;
    const imagenesAEliminarCount =
      window.imagenesMarcadasParaEliminar?.length || 0;
    const nuevasImagenesCount = formData.files.length;

    const totalFinal =
      imagenesActualesCount - imagenesAEliminarCount + nuevasImagenesCount;

    if (totalFinal <= 0) {
      alert(
        "❌ Error: El producto debe tener al menos una imagen después de la actualización"
      );
      btnSubmit.innerHTML = textoOriginal;
      btnSubmit.disabled = false;
      return;
    }

    const updateData = await prepararDatosActualizacion(formData);

    const resultado = await enviarActualizacion(id, updateData);

    // Eliminar imágenes de Cloudinary en segundo plano
    if (
      window.imagenesMarcadasParaEliminar &&
      window.imagenesMarcadasParaEliminar.length > 0
    ) {
      mostrarNotificacion(
        `Eliminando ${window.imagenesMarcadasParaEliminar.length} imágenes...`,
        "info"
      );

      const publicIdsAEliminar = [...window.imagenesMarcadasParaEliminar];
      window.imagenesMarcadasParaEliminar = [];

      // Eliminar en segundo plano
      setTimeout(async () => {
        try {
          const resultadoEliminacion = await eliminarImagenesBackend(
            publicIdsAEliminar
          );

          if (resultadoEliminacion.fallidas.length > 0) {
            console.warn(
              `${resultadoEliminacion.fallidas.length} fallos en eliminación`
            );
          }

          mostrarNotificacion(
            `Imágenes eliminadas: ${resultadoEliminacion.exitosas.length} exitosas, ${resultadoEliminacion.fallidas.length} fallidas`,
            resultadoEliminacion.fallidas.length > 0 ? "warning" : "success"
          );
        } catch (error) {
          console.error("Error en proceso de eliminación:", error);
          mostrarNotificacion(
            "Error al eliminar imágenes de Cloudinary",
            "error"
          );
        }
      }, 1000);
    }
    // Limpiar estado
    window.imagenesMarcadasParaEliminar = [];

    mostrarMensajeActualizacionExito(resultado, formData.nombre);

    // Recargar datos
    await cargarProductos();
    actualizarDashboard();

    // Limpiar y cambiar sección
    limpiarFormularioActualizar();
    cambiarASeccion("productos", "productos");
  } catch (error) {
    console.error("Error en actualización:", error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
  }
}

/**
 * Muestra previsualización de nuevas imágenes seleccionadas CON BOTÓN DE ELIMINAR
 */
function mostrarPreviewNuevasImagenes() {
  const container = document.getElementById("preview-nuevas-imagenes");
  container.innerHTML = "";

  window.imagenesActualizacion.forEach((file, index) => {
    const url = URL.createObjectURL(file);

    const div = document.createElement("div");
    div.className = "imagen-preview";
    div.style.position = "relative";
    div.style.display = "inline-block";
    div.style.margin = "10px";

    div.innerHTML = `
      <img src="${url}" style="width:100px;height:100px;object-fit:cover;">
      <button onclick="eliminarImagenNueva(${index})"
              style="position:absolute;top:5px;right:5px;
                     background:#dc3545;color:white;border:none;
                     border-radius:50%;width:25px;height:25px;cursor:pointer;">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(div);
  });
}

/* Eliminar una imagen nueva antes de actualizar */
function eliminarImagenNueva(index) {
  if (
    !window.imagenesActualizacion ||
    !Array.isArray(window.imagenesActualizacion)
  ) {
    alert("❌ No hay imágenes nuevas");
    return;
  }

  if (index < 0 || index >= window.imagenesActualizacion.length) {
    console.error("Índice inválido");
    return;
  }

  const img = window.imagenesActualizacion[index];
  const nombre = img?.name || img?.nombre_original || `Imagen ${index + 1}`;

  if (!confirm(`¿Quitar imagen nueva seleccionada?\n\n${nombre}`)) {
    return;
  }

  window.imagenesActualizacion.splice(index, 1);
  mostrarPreviewNuevasImagenes();
  mostrarNotificacion("Imagen nueva eliminada", "info");
}

/**
 * Muestra una notificación temporal
 */
function mostrarNotificacion(mensaje, tipo = "info") {
  const tipos = {
    success: { bg: "#28a745", icon: "✅" },
    error: { bg: "#dc3545", icon: "❌" },
    info: { bg: "#17a2b8", icon: "ℹ️" },
    warning: { bg: "#ffc107", icon: "⚠️" },
  };

  const config = tipos[tipo] || tipos.info;

  // Crear notificación
  const notificacion = document.createElement("div");
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${config.bg};
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  notificacion.innerHTML = `
    <span>${config.icon}</span>
    <span>${mensaje}</span>
  `;

  document.body.appendChild(notificacion);

  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    notificacion.style.transition = "opacity 0.5s";
    notificacion.style.opacity = "0";
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 500);
  }, 3000);
}

/* Prepara datos para actualización */
async function prepararDatosActualizacion(formData) {
  const updateData = {
    nombre: formData.nombre,
    descripcion: formData.descripcion,
    precio_original: formData.precioOriginal,
    descuento: formData.descuento,
    stock: formData.stock,
    ria: formData.categoria,
  };

  // OBTENER IMÁGENES ORIGINALES DIRECTAMENTE DE LA BD
  const idProducto = document.getElementById("update-id")?.value;
  let imagenesOriginales = [];

  if (idProducto) {
    try {
      const response = await fetchConAuth(
        `${window.BACKEND_URL}/productos/${idProducto}`
      );
      if (response) {
        const result = await response.json();
        if (result.success && result.producto && result.producto.imagenes) {
          imagenesOriginales = result.producto.imagenes;
        }
      }
    } catch (error) {
      console.warn("No se pudieron obtener imágenes de la BD:", error);
      imagenesOriginales = window.imagenesActualesProducto || [];
    }
  }

  // PROCESAR IMÁGENES
  const imagenesParaEnviar = [];

  // 1. Agregar imágenes originales (excepto las marcadas para eliminar)
  imagenesOriginales.forEach((img, index) => {
    // Verificar si esta imagen está marcada para eliminación
    const marcadaParaEliminar =
      window.imagenesMarcadasParaEliminar &&
      window.imagenesMarcadasParaEliminar.some(
        (publicId) =>
          publicId === img.public_id ||
          (img.public_id && img.public_id.includes(publicId))
      );

    if (!marcadaParaEliminar) {
      imagenesParaEnviar.push({
        url: img.url,
        public_id: img.public_id || `original-${Date.now()}-${index}`,
        es_principal: img.es_principal || false,
        nombre_original: img.nombre_original || `imagen-${index + 1}`,
      });
    }
  });

  // 2. Subir y agregar nuevas imágenes si las hay
  if (formData.files.length > 0) {
    const nuevasImagenes = await subirImagenesACloudinary(formData.files);

    nuevasImagenes.forEach((img, index) => {
      imagenesParaEnviar.push({
        url: img.url,
        public_id: img.public_id,
        es_principal: imagenesParaEnviar.length === 0 && index === 0,
        nombre_original: img.nombre_original,
      });
    });
  }

  // 3. Asegurar que al menos una imagen sea principal
  if (
    imagenesParaEnviar.length > 0 &&
    !imagenesParaEnviar.some((img) => img.es_principal)
  ) {
    imagenesParaEnviar[0].es_principal = true;
  }

  // 4. Asignar al updateData
  updateData.imagenes = imagenesParaEnviar;

  return updateData;
}

/**
 * Envía la actualización al backend
 */
async function enviarActualizacion(id, data) {
  const response = await fetchConAuth(`${window.BACKEND_URL}/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response) throw new Error("No se pudo conectar con el servidor");

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result.error ||
        `Error ${response.status}: ${result.detalles || "Sin detalles"}`
    );
  }

  return result;
}

/**
 * Muestra mensaje de éxito en actualización
 */
function mostrarMensajeActualizacionExito(resultado, nombreProducto) {
  if (resultado.producto?.precio_final) {
    const precioFinalBackend = resultado.producto.precio_final;
    alert(
      `✅ Producto "${nombreProducto}" actualizado exitosamente\n• Precio final: HNL ${precioFinalBackend.toFixed(
        2
      )}`
    );
  } else {
    alert(`✅ Producto "${nombreProducto}" actualizado exitosamente`);
  }
}

/**
 * Oculta el formulario de actualización
 */
function ocultarFormularioActualizar() {
  const resultadoBusqueda = document.getElementById("resultado-busqueda");
  const formActualizar = document.getElementById("form-actualizar");

  if (resultadoBusqueda) resultadoBusqueda.style.display = "none";
  if (formActualizar) formActualizar.style.display = "none";
}

/**
 * Limpia el formulario de actualización - VERSIÓN 2
 */
function limpiarFormularioActualizar() {
  if (!AuthService.isAdmin()) return;

  if (confirm("¿Limpiar formulario? Se perderán los cambios no guardados")) {
    const formActualizar = document.getElementById("form-actualizar");
    if (formActualizar) {
      formActualizar.reset();
    }

    ocultarFormularioActualizar();

    const imagenesActuales = document.getElementById("imagenes-actuales");
    const previewNuevasImagenes = document.getElementById(
      "preview-nuevas-imagenes"
    );

    if (imagenesActuales) imagenesActuales.innerHTML = "";
    if (previewNuevasImagenes) previewNuevasImagenes.innerHTML = "";

    // RESET COMPLETO de variables de imágenes
    window.imagenesActualizacion = [];
    window.imagenesActualesProducto = [];
    window.imagenesMarcadasParaEliminar = [];
  }
}

/**
 * Subir imágenes al registrar el producto
 */
async function subirImagenesACloudinary(files) {
  imagenesRegistro = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      const cloudinaryData = await response.json();
      imagenesRegistro.push({
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        es_principal: i === 0,
        nombre_original: file.name,
      });
    } catch (error) {
      console.error(`Error al subir imagen ${file.name}:`, error);
      throw new Error(`No se pudo subir "${file.name}"`);
    }
  }

  return imagenesRegistro;
}

/**
 * Elimina imágenes de Cloudinary usando el endpoint de múltiples eliminaciones
 */
async function eliminarImagenesBackend(publicIds) {
  if (!publicIds || publicIds.length === 0) {
    return { exitosas: [], fallidas: [] };
  }

  try {
    // Usar el nuevo endpoint para múltiples imágenes
    const response = await fetchAdmin(
      `${window.BACKEND_URL}/productos/imagenes/eliminar-multiple`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_ids: publicIds }),
      }
    );

    if (!response) {
      throw new Error("No se pudo conectar con el servidor");
    }

    const result = await response.json();

    if (result.success) {
      return {
        exitosas: result.detalles?.filter((d) => d.success) || [],
        fallidas: result.detalles?.filter((d) => !d.success) || [],
      };
    } else {
      throw new Error(result.error || "Error al eliminar imágenes");
    }
  } catch (error) {
    console.error("Error al eliminar imágenes:", error);
    return await eliminarImagenesIndividualmente(publicIds);
  }
}

/**
 * Función de fallback: elimina imágenes una por una
 */
async function eliminarImagenesIndividualmente(publicIds) {
  const exitosas = [];
  const fallidas = [];

  for (const publicId of publicIds) {
    try {
      const response = await fetchAdmin(
        `${window.BACKEND_URL}/productos/imagenes/eliminar`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: publicId }),
        }
      );

      if (response && response.ok) {
        const result = await response.json();
        if (result.success) {
          exitosas.push({ public_id: publicId, success: true });
        } else {
          throw new Error(result.error || "Error en respuesta");
        }
      } else {
        throw new Error("Error en la petición");
      }
    } catch (error) {
      console.error(`Error eliminando ${publicId}:`, error);
      fallidas.push({
        public_id: publicId,
        success: false,
        error: error.message,
      });
    }

    // Pequeña pausa
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { exitosas, fallidas };
}

/**
 * Configura cálculos de precios para formularios
 */
function configurarCalculosPrecios() {
  // Para registro
  if (AuthService.isAdmin()) {
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
  }

  // Para actualizar
  if (AuthService.isAdmin()) {
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
}

/**
 * Función segura para cambiar de sección
 * Reemplaza a cambiarSeccion si no está disponible
 */
function cambiarASeccion(seccion, titulo = "") {
  // Primero intentar con cambiarSeccion si existe
  if (typeof cambiarSeccion === "function") {
    cambiarSeccion(seccion, titulo);
    return;
  }

  // Obtener todos los botones del menú
  const botonesMenu = document.querySelectorAll(".menu-btn");

  // Buscar el botón que corresponde a la sección deseada
  let botonEncontrado = null;
  botonesMenu.forEach((boton) => {
    if (boton.dataset.section === seccion) {
      botonEncontrado = boton;
    }
  });

  if (botonEncontrado) {
    // Verificar permisos para la sección
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
    botonEncontrado.classList.add("active");

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
    }

    // Actualizar título si se proporciona
    if (titulo && tituloSeccion) {
      tituloSeccion.textContent = titulo;
    } else if (tituloSeccion) {
      // Usar el texto del botón si no se proporciona título
      const textoBoton = botonEncontrado.querySelector("span");
      if (textoBoton) {
        tituloSeccion.textContent = textoBoton.textContent;
      }
    }

    // Si es la sección de dashboard, actualizar estadísticas
    if (seccion === "dashboard") {
      actualizarDashboard();
    }
  } else {
    // Fallback: intentar mostrar la sección directamente
    document.querySelectorAll(".content-section").forEach((seccionElem) => {
      seccionElem.classList.remove("active");
    });

    const seccionId = seccion + "-section";
    const seccionElement = document.getElementById(seccionId);
    if (seccionElement) {
      seccionElement.classList.add("active");
    }
  }
}

/*
 *Confirmar que sacamos el producto del catalogo
 */
async function confirmarDesactivarProducto(id) {
  if (
    !confirm(
      "¿Deseas desactivar este producto? No se eliminará, solo se ocultará del catálogo."
    )
  )
    return;

  try {
    const response = await fetchConAuth(
      `${window.BACKEND_URL}/productos/${id}/estado`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Error al desactivar");

    alert("✅ Producto desactivado correctamente");
    await cargarProductos();
    actualizarDashboard();
  } catch (error) {
    alert(`❌ Error: ${error.message}`);
  }
}

/*
 *Confirmar que volvemos a poner el producto del catalogo
 */
async function confirmarActivarProducto(id) {
  if (!confirm("¿Deseas volver a colocar este producto en el catálogo?"))
    return;

  try {
    const response = await fetchConAuth(
      `${window.BACKEND_URL}/productos/${id}/estado`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Error al activar");

    alert("✅ Producto activado nuevamente");
    await cargarProductos();
    actualizarDashboard();
  } catch (error) {
    alert(`❌ Error: ${error.message}`);
  }
}

/* =============================
   IMÁGENES DEL PRODUCTO
============================= */

function mostrarImagenesActualesProducto(imagenes, esRefresco = false) {
  const container = document.getElementById("imagenes-actuales");
  if (!container) return;

  container.innerHTML = "";

  if (!imagenes || imagenes.length === 0) {
    container.innerHTML =
      "<p style='color:#666;font-style:italic'>No hay imágenes</p>";
    return;
  }

  if (!esRefresco) {
    window.imagenesActualesProducto = imagenes;
  }

  imagenes.forEach((imagen, index) => {
    const url = imagen.url || imagen;
    const publicId = imagen.public_id || `img-${index}`;

    const marcada = window.imagenesMarcadasParaEliminar?.includes(publicId);

    const div = document.createElement("div");
    div.style.cssText = `
      display:inline-block;
      position:relative;
      margin:10px;
      border:${marcada ? "2px solid #dc3545" : "1px solid #ddd"};
      padding:5px;
      border-radius:5px;
      opacity:${marcada ? "0.6" : "1"};
    `;

    div.innerHTML = `
  <img src="${url}" style="width:100px;height:100px;object-fit:cover">

  ${
    marcada
      ? `<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
                 background:white;color:#dc3545;font-weight:bold;padding:3px 10px;">
            ELIMINADA
         </div>
         <button type="button" onclick="revertirEliminacionImagen('${publicId}', event)"
                 style="position:absolute;bottom:5px;right:5px;background:green;color:white;border:none;padding:3px 8px;cursor:pointer;" title="Revertir" >
           Revertir
         </button>`
      : `<button type="button" onclick="eliminarImagenActual(${index}, event)"
               style="position:absolute;top:5px;right:5px;background:#dc3545;color:white;border:none;
                      width:25px;height:25px;border-radius:10%;cursor:pointer;" title="Eliminar">
           <a class="fa fa-trash" style="color:white"></a>
         </button>`
  }
`;

    container.appendChild(div);
  });
}

function eliminarImagenActual(index) {
  if (!window.imagenesActualesProducto) return;

  const imagen = window.imagenesActualesProducto[index];
  if (!imagen) return;

  const publicId = imagen.public_id;

  if (
    !confirm("¿Está seguro de eliminar esta imagen? Esta acción es permanente.")
  ) {
    return;
  }

  if (!window.imagenesMarcadasParaEliminar) {
    window.imagenesMarcadasParaEliminar = [];
  }

  if (publicId && !window.imagenesMarcadasParaEliminar.includes(publicId)) {
    window.imagenesMarcadasParaEliminar.push(publicId);
  }

  actualizarVistaImagenesActuales();
}

function revertirEliminacionImagen(publicId) {
  if (!window.imagenesMarcadasParaEliminar) return;

  const index = window.imagenesMarcadasParaEliminar.indexOf(publicId);
  if (index !== -1) {
    window.imagenesMarcadasParaEliminar.splice(index, 1);
    actualizarVistaImagenesActuales();
    mostrarNotificacion("Eliminación revertida", "success");
  }
}

function actualizarVistaImagenesActuales() {
  mostrarImagenesActualesProducto(window.imagenesActualesProducto, true);
}

// ============================================
//     FUNCIÓN PARA ACTUALIZAR CONTROLES DE PAGINACIÓN DE PRODUCTOS
// ============================================
function actualizarControlesPaginacionProductos(totalProductos = 0) {
  // Buscar o crear contenedor de paginación
  let contenedorPaginacion = document.querySelector(".paginacion-productos");

  if (!contenedorPaginacion) {
    // Buscar la sección de productos
    const productosSection = document.getElementById("productos-section");
    if (!productosSection) {
      return;
    }
    
    // Crear contenedor
    contenedorPaginacion = document.createElement("div");
    contenedorPaginacion.className = "paginacion-productos";
    contenedorPaginacion.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-top: 1px solid #dee2e6;
      margin-top: 0;
      border-radius: 0 0 8px 8px;
    `;
    
    // Insertar después de la tabla
    const tableContainer = productosSection.querySelector(".table-container");
    if (tableContainer) {
      tableContainer.parentNode.insertBefore(contenedorPaginacion, tableContainer.nextSibling);
    } else {
      productosSection.appendChild(contenedorPaginacion);
    }
  }

  // Calcular rangos
  const inicio = (paginaActualProductos - 1) * limitePorPaginaProductos + 1;
  const final = Math.min(paginaActualProductos * limitePorPaginaProductos, totalProductos);

  // Texto informativo
  let textoMostrando = "";
  
  if (totalProductos === 0) {
    textoMostrando = "No hay productos registrados";
  } else {
    textoMostrando = `Mostrando ${inicio}-${final} de ${totalProductos} productos`;
  }

  // Generar números de página
  const numerosPagina = generarNumerosPaginaProductos();

  // Crear HTML de paginación
  const htmlPaginacion = `
    <div class="info-paginacion" style="font-size: 14px; color: #6c757d;">
      ${textoMostrando}
    </div>
    
    <div class="controles-paginacion" style="display: flex; align-items: center; gap: 10px;">
      <button 
        class="btn-pagina ${paginaActualProductos === 1 ? "disabled" : ""}"
        ${paginaActualProductos === 1 ? "disabled" : ""}
        onclick="irPaginaAnteriorProductos()"
        style="
          padding: 6px 12px;
          background-color: ${paginaActualProductos === 1 ? "#e9ecef" : "#007bff"};
          color: ${paginaActualProductos === 1 ? "#6c757d" : "white"};
          border: 1px solid ${paginaActualProductos === 1 ? "#dee2e6" : "#007bff"};
          border-radius: 4px;
          cursor: ${paginaActualProductos === 1 ? "not-allowed" : "pointer"};
          font-size: 14px;
          min-width: 80px;
        "
      >
        <i class="fas fa-chevron-left"></i> Anterior
      </button>
      
      <div class="numeros-pagina" style="display: flex; gap: 5px;">
        ${numerosPagina}
      </div>
      
      <button 
        class="btn-pagina ${paginaActualProductos === totalPaginasProductos ? "disabled" : ""}"
        ${paginaActualProductos === totalPaginasProductos ? "disabled" : ""}
        onclick="irPaginaSiguienteProductos()"
        style="
          padding: 6px 12px;
          background-color: ${paginaActualProductos === totalPaginasProductos ? "#e9ecef" : "#007bff"};
          color: ${paginaActualProductos === totalPaginasProductos ? "#6c757d" : "white"};
          border: 1px solid ${paginaActualProductos === totalPaginasProductos ? "#dee2e6" : "#007bff"};
          border-radius: 4px;
          cursor: ${paginaActualProductos === totalPaginasProductos ? "not-allowed" : "pointer"};
          font-size: 14px;
          min-width: 80px;
        "
      >
        Siguiente <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
  
  contenedorPaginacion.innerHTML = htmlPaginacion;
}

// ============================================
//     FUNCIÓN PARA GENERAR NÚMEROS DE PÁGINA DE PRODUCTOS
// ============================================
function generarNumerosPaginaProductos() {
  let numerosHTML = "";
  const maxPaginasVisibles = 5;

  if (totalPaginasProductos <= maxPaginasVisibles) {
    // Mostrar todas las páginas
    for (let i = 1; i <= totalPaginasProductos; i++) {
      numerosHTML += crearBotonPaginaProductos(i);
    }
  } else {
    // Lógica para mostrar páginas con elipsis
    if (paginaActualProductos <= 3) {
      // Primeras páginas
      for (let i = 1; i <= 4; i++) {
        numerosHTML += crearBotonPaginaProductos(i);
      }
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      numerosHTML += crearBotonPaginaProductos(totalPaginasProductos);
    } else if (paginaActualProductos >= totalPaginasProductos - 2) {
      // Últimas páginas
      numerosHTML += crearBotonPaginaProductos(1);
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      for (let i = totalPaginasProductos - 3; i <= totalPaginasProductos; i++) {
        numerosHTML += crearBotonPaginaProductos(i);
      }
    } else {
      // Páginas intermedias
      numerosHTML += crearBotonPaginaProductos(1);
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      for (let i = paginaActualProductos - 1; i <= paginaActualProductos + 1; i++) {
        numerosHTML += crearBotonPaginaProductos(i);
      }
      numerosHTML += `<span style="padding: 6px 12px; color: #6c757d;">...</span>`;
      numerosHTML += crearBotonPaginaProductos(totalPaginasProductos);
    }
  }
  
  return numerosHTML;
}

// ============================================
//     FUNCIÓN AUXILIAR PARA CREAR BOTÓN DE PÁGINA DE PRODUCTOS
// ============================================
function crearBotonPaginaProductos(numero) {
  const activo = numero === paginaActualProductos;
  return `
    <button 
      class="btn-numero-pagina ${activo ? 'active' : ''}"
      onclick="irPaginaEspecificaProductos(${numero})"
      style="
        padding: 6px 12px;
        background-color: ${activo ? "#007bff" : "white"};
        color: ${activo ? "white" : "#007bff"};
        border: 1px solid ${activo ? "#007bff" : "#dee2e6"};
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: ${activo ? "bold" : "normal"};
        min-width: 40px;
      "
    >
      ${numero}
    </button>
  `;
}

// ============================================
//     FUNCIONES DE NAVEGACIÓN PARA PRODUCTOS
// ============================================
function irPaginaAnteriorProductos() {
  if (paginaActualProductos > 1) {
    paginaActualProductos--;
    cargarProductos();
  }
}

function irPaginaSiguienteProductos() {
  if (paginaActualProductos < totalPaginasProductos) {
    paginaActualProductos++;
    cargarProductos();
  }
}

function irPaginaEspecificaProductos(pagina) {
  if (pagina >= 1 && pagina <= totalPaginasProductos) {
    paginaActualProductos = pagina;
    cargarProductos();
  }
}

function configurarFiltrosProductos() {
  const ids = [
    "buscador-productos",
    "filtro-estado-producto",
    "filtro-stock",
    "filtro-categoria-producto"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        // Resetear a página 1 cuando cambia un filtro
        paginaActualProductos = 1;
        cargarProductos();
      });
    }
  });

  // Para el buscador, usar debounce para no hacer demasiadas peticiones
  const buscador = document.getElementById("buscador-productos");
  if (buscador) {
    let timeout;
    buscador.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        paginaActualProductos = 1;
        cargarProductos();
      }, 500);
    });
  }
}

/**
 * Actualiza el contador de productos en el dashboard
 */
function actualizarContadorProductosDashboard() {
  const productosActivos = productosCargados.filter(
    (p) => p.activo !== false
  ).length;
  
  const elementoNumeroProductos = document.getElementById("numero-productos");
  if (elementoNumeroProductos) {
    elementoNumeroProductos.textContent = productosActivos;
  }
  
  // También mostrar el total de productos
  const elementoTotalProductos = document.getElementById("total-productos");
  if (elementoTotalProductos) {
    elementoTotalProductos.textContent = totalProductosBD;
  }
}

document.addEventListener("DOMContentLoaded", configurarFiltrosProductos);

// Exportar funciones para uso global
window.cargarProductos = cargarProductos;
window.obtenerProductosDelBackend = obtenerProductosDelBackend;
window.actualizarTablaProductos = actualizarTablaProductos;
window.filtrarProductos = filtrarProductos;
window.registrarProducto = registrarProducto;
window.buscarParaActualizar = buscarParaActualizar;
window.cargarParaActualizar = cargarParaActualizar;
window.obtenerProductoPorId = obtenerProductoPorId;
window.actualizarProducto = actualizarProducto;
window.limpiarFormularioActualizar = limpiarFormularioActualizar;
window.mostrarImagenesActualesProducto = mostrarImagenesActualesProducto;
window.configurarCalculosPrecios = configurarCalculosPrecios;
window.cambiarASeccion = cambiarASeccion;
window.confirmarDesactivarProducto = confirmarDesactivarProducto;
window.confirmarActivarProducto = confirmarActivarProducto;
window.prepararDatosActualizacion = prepararDatosActualizacion;
window.eliminarImagenActual = eliminarImagenActual;
window.revertirEliminacionImagen = revertirEliminacionImagen;
window.mostrarNotificacion = mostrarNotificacion;
window.mostrarPreviewNuevasImagenes = mostrarPreviewNuevasImagenes;
window.eliminarImagenNueva = eliminarImagenNueva;
window.actualizarControlesPaginacionProductos = actualizarControlesPaginacionProductos;
window.irPaginaAnteriorProductos = irPaginaAnteriorProductos;
window.irPaginaSiguienteProductos = irPaginaSiguienteProductos;
window.irPaginaEspecificaProductos = irPaginaEspecificaProductos;